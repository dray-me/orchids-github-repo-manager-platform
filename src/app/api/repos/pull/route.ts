import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const GITHUB_API = "https://api.github.com";

async function githubFetch(endpoint: string, token: string) {
  const res = await fetch(`${GITHUB_API}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `GitHub API error: ${res.status}`);
  }
  
  return res.json();
}

interface TreeItem {
  path: string;
  type: string;
  size?: number;
  sha: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const repoFullName = searchParams.get("repo");
    const branch = searchParams.get("branch") || "main";

    if (!repoFullName) {
      return NextResponse.json({ error: "Repository name required" }, { status: 400 });
    }

    const refData = await githubFetch(
      `/repos/${repoFullName}/git/ref/heads/${branch}`,
      session.accessToken
    );

    const commitData = await githubFetch(
      `/repos/${repoFullName}/git/commits/${refData.object.sha}`,
      session.accessToken
    );

    const treeData = await githubFetch(
      `/repos/${repoFullName}/git/trees/${commitData.tree.sha}?recursive=1`,
      session.accessToken
    );

    const files = treeData.tree.map((item: TreeItem) => ({
      path: item.path,
      type: item.type,
      size: item.size || 0,
      sha: item.sha,
    }));

    return NextResponse.json({
      branch,
      commitSha: refData.object.sha,
      files,
      totalFiles: files.filter((f: { type: string }) => f.type === "blob").length,
    });
  } catch (error) {
    console.error("Pull error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to pull repository" },
      { status: 500 }
    );
  }
}
