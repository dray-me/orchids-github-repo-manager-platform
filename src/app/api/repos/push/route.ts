import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase, ExtractedFile } from "@/lib/supabase";

const GITHUB_API = "https://api.github.com";

async function githubFetch(endpoint: string, token: string, options: RequestInit = {}) {
  const res = await fetch(`${GITHUB_API}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `GitHub API error: ${res.status}`);
  }
  
  return res.json();
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.accessToken || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { repoFullName, uploadId, commitMessage, branch = "main" } = body;

    if (!repoFullName || !uploadId) {
      return NextResponse.json({ error: "Repository and upload ID required" }, { status: 400 });
    }

    const { data: upload } = await supabase
      .from("uploads")
      .select("extracted_files")
      .eq("id", uploadId)
      .eq("user_id", session.user.id)
      .single();

    if (!upload?.extracted_files) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }

    const files = upload.extracted_files as ExtractedFile[];
    const filesToPush = files.filter(f => !f.isDirectory && f.content);

    if (filesToPush.length === 0) {
      return NextResponse.json({ error: "No files to push" }, { status: 400 });
    }

    let baseSha: string | null = null;
    let baseTreeSha: string | null = null;
    
    try {
      const refData = await githubFetch(`/repos/${repoFullName}/git/ref/heads/${branch}`, session.accessToken);
      baseSha = refData.object.sha;
      const commitData = await githubFetch(`/repos/${repoFullName}/git/commits/${baseSha}`, session.accessToken);
      baseTreeSha = commitData.tree.sha;
    } catch {
      baseSha = null;
      baseTreeSha = null;
    }

    const blobs = await Promise.all(
      filesToPush.map(async (file) => {
        const blobData = await githubFetch(`/repos/${repoFullName}/git/blobs`, session.accessToken, {
          method: "POST",
          body: JSON.stringify({
            content: Buffer.from(file.content || "").toString("base64"),
            encoding: "base64",
          }),
        });
        return {
          path: file.path.replace(/^[^/]+\//, ""),
          mode: "100644" as const,
          type: "blob" as const,
          sha: blobData.sha,
        };
      })
    );

    const treeData = await githubFetch(`/repos/${repoFullName}/git/trees`, session.accessToken, {
      method: "POST",
      body: JSON.stringify({
        base_tree: baseTreeSha || undefined,
        tree: blobs,
      }),
    });

    const commitBody: { message: string; tree: string; parents?: string[] } = {
      message: commitMessage || `Upload files from ${new Date().toISOString()}`,
      tree: treeData.sha,
    };
    
    if (baseSha) {
      commitBody.parents = [baseSha];
    }

    const newCommit = await githubFetch(`/repos/${repoFullName}/git/commits`, session.accessToken, {
      method: "POST",
      body: JSON.stringify(commitBody),
    });

    if (baseSha) {
      await githubFetch(`/repos/${repoFullName}/git/refs/heads/${branch}`, session.accessToken, {
        method: "PATCH",
        body: JSON.stringify({ sha: newCommit.sha }),
      });
    } else {
      await githubFetch(`/repos/${repoFullName}/git/refs`, session.accessToken, {
        method: "POST",
        body: JSON.stringify({
          ref: `refs/heads/${branch}`,
          sha: newCommit.sha,
        }),
      });
    }

    await supabase
      .from("uploads")
      .update({ status: "pushed" })
      .eq("id", uploadId);

    return NextResponse.json({
      success: true,
      commitSha: newCommit.sha,
      filesCount: filesToPush.length,
      branch,
    });
  } catch (error) {
    console.error("Push error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to push files" },
      { status: 500 }
    );
  }
}
