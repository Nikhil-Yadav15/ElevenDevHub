// src/app/api/projects/[id]/deployments/route.js
import { getEnv } from "@/lib/cloudflare/env";
import { getDB, findProjectById } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getUserGitHubToken } from "@/lib/auth/token";
import { getWorkflowRuns, getCommitDetails } from "@/lib/github";
import { getCachedDeployments } from "@/lib/cache/deployments";

export async function GET(request, { params }) {
  try {
    const env = await getEnv();
    const db = getDB(env);
    
    const user = await getCurrentUser(request);
    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    // ✅ FIX: Await params in Next.js 15
    const { id } = await params;
    const project = await findProjectById(db, id);
    
    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }
    
    // Verify ownership
    if (project.userId !== user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const token = await getUserGitHubToken(db, user.id, env.ENCRYPTION_SECRET);
    
    // Check if force refresh requested
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get("refresh") === "true";
    
    // Fetch deployments with caching
    const { data: deployments, fromCache } = await getCachedDeployments(
      db,
      project.id,
      async () => {
        // Fetch workflow runs from GitHub
        const { runs } = await getWorkflowRuns(
          token,
          project.repoOwner,
          project.repoName,
          5 // Limit to last 5
        );
        
        // Enrich with commit details
        const enrichedRuns = await Promise.all(
          runs.map(async (run) => {
            try {
              const { commit } = await getCommitDetails(
                token,
                project.repoOwner,
                project.repoName,
                run.headSha
              );
              
              return {
                ...run,
                commit: {
                  message: commit.message,
                  author: commit.author,
                  sha: commit.sha.slice(0, 7), // Short SHA
                  url: commit.url,
                },
              };
            } catch (error) {
              // If commit fetch fails, return run without commit details
              return {
                ...run,
                commit: {
                  message: "Unable to fetch commit",
                  author: "Unknown",
                  sha: run.headSha.slice(0, 7),
                  url: null,
                },
              };
            }
          })
        );
        
        return enrichedRuns;
      }
    );
    
    // Determine if we should keep polling
    const hasActiveDeployment = deployments.some(
      d => d.status === 'queued' || d.status === 'in_progress'
    );
    
    return Response.json({
      success: true,
      deployments,
      fromCache,
      hasActiveDeployment,
      project: {
        id: project.id,
        name: project.name,
        repoOwner: project.repoOwner,
        repoName: project.repoName,
      },
    });
  } catch (error) {
    console.error("Get deployments error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
