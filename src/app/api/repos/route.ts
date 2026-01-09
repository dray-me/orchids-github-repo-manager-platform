import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

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
    const { name, description, isPrivate, uploadId } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Repository name is required" }, { status: 400 });
    }

    const repoData = await githubFetch("/user/repos", session.accessToken, {
      method: "POST",
      body: JSON.stringify({
        name,
        description: description || "",
        private: isPrivate || false,
        auto_init: false,
      }),
    });

    const { data: repo, error } = await supabase
      .from("repositories")
      .insert({
        user_id: session.user.id,
        github_repo_id: repoData.id.toString(),
        repo_name: repoData.name,
        repo_full_name: repoData.full_name,
        repo_url: repoData.html_url,
        description: repoData.description,
        is_private: repoData.private,
        default_branch: repoData.default_branch || "main",
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
    }

    if (uploadId) {
      await supabase
        .from("uploads")
        .update({ repository_id: repo?.id })
        .eq("id", uploadId);
    }

    return NextResponse.json({
      repository: repo,
      githubRepo: {
        id: repoData.id,
        name: repoData.name,
        full_name: repoData.full_name,
        html_url: repoData.html_url,
        clone_url: repoData.clone_url,
      },
    });
  } catch (error) {
    console.error("Create repo error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create repository" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.accessToken || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const githubRepos = await githubFetch("/user/repos?sort=updated&per_page=100", session.accessToken);

    const { data: dbRepos } = await supabase
      .from("repositories")
      .select("*")
      .eq("user_id", session.user.id);

    return NextResponse.json({
      repositories: githubRepos,
      managedRepos: dbRepos || [],
    });
  } catch (error) {
    console.error("Fetch repos error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}
