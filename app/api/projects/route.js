// src/app/api/projects/route.js
import { getEnv } from "@/lib/cloudflare/env";
import { getDB, createProject, getProjectsByUserId, findProjectByRepo } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getUserGitHubToken } from "@/lib/auth/token";
import { invalidateReposCache } from "@/lib/cache/repos";
import {
  setRepoSecret,
  setRepoVariable,
  checkWorkflowExists,
  getWorkflowTemplate,
  commitWorkflowFile,
} from "@/lib/github";
import { generatePagesProjectName, createPagesProject } from "@/lib/cloudflare/pages";

/**
 * GET /api/projects - List all projects for current user
 */
export async function GET(request) {
  try {
    const env = await getEnv();
    const db = getDB(env);
    
    const user = await getCurrentUser(request);
    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    const projects = await getProjectsByUserId(db, user.id);
    
    return Response.json({
      success: true,
      projects: projects.map(p => ({
        id: p.id,
        name: p.name,
        repoOwner: p.repoOwner,
        repoName: p.repoName,
        productionBranch: p.productionBranch,
        cfProjectName: p.cfProjectName,
        cfSubdomain: p.cfSubdomain,
        url: `https://${p.cfSubdomain}`,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get projects error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/projects - Create new deployment
 * Body: { repoOwner, repoName, defaultBranch }
 */
export async function POST(request) {
  try {
    const env = await getEnv();
    const db = getDB(env);
    
    // Step 0: Authenticate user
    const user = await getCurrentUser(request);
    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    // Parse request body
    const body = await request.json();
    const { repoOwner, repoName, defaultBranch = "main" } = body;
    
    if (!repoOwner || !repoName) {
      return Response.json(
        { error: "repoOwner and repoName are required" },
        { status: 400 }
      );
    }
    
    // Check if project already exists
    const existing = await findProjectByRepo(db, repoOwner, repoName);
    if (existing) {
      return Response.json(
        { error: "Project already exists for this repository" },
        { status: 409 }
      );
    }
    
    // Get user's GitHub token
    const githubToken = await getUserGitHubToken(db, user.id, env.ENCRYPTION_SECRET);
    
    console.log(`\n🚀 Starting deployment for ${repoOwner}/${repoName}...`);
    
    // STEP 1: Create Cloudflare Pages project
    console.log("📦 Step 1/8: Creating Cloudflare Pages project...");
    const cfProjectName = generatePagesProjectName(repoName);
    const cfProject = await createPagesProject(
      env.CF_ACCOUNT_ID,
      env.CF_API_TOKEN,
      cfProjectName,
      defaultBranch
    );
    console.log(`   ✅ Created: ${cfProject.subdomain}`);
    
    // STEP 2: Check if workflow already exists
    console.log("📝 Step 2/8: Checking for existing workflow...");
    const workflowCheck = await checkWorkflowExists(githubToken, repoOwner, repoName);
    console.log(`   ${workflowCheck.exists ? "⚠️  Found existing workflow" : "✅ No existing workflow"}`);
    
    // STEP 3: Set GitHub secret - ELEVEN_CF_TOKEN
    console.log("🔐 Step 3/8: Setting ELEVEN_CF_TOKEN secret...");
    await setRepoSecret(
      githubToken,
      repoOwner,
      repoName,
      "ELEVEN_CF_TOKEN",
      env.CF_API_TOKEN
    );
    console.log("   ✅ Secret set");
    
    // STEP 4: Set GitHub secret - ELEVEN_ACCOUNT_ID
    console.log("🔐 Step 4/8: Setting ELEVEN_ACCOUNT_ID secret...");
    await setRepoSecret(
      githubToken,
      repoOwner,
      repoName,
      "ELEVEN_ACCOUNT_ID",
      env.CF_ACCOUNT_ID
    );
    console.log("   ✅ Secret set");

    // STEP 4.5: Set custom environment variables
    if (body.envVars && body.envVars.length > 0) {
      console.log(`🔐 Step 4.5/8: Setting ${body.envVars.length} custom environment variables...`);
      for (const envVar of body.envVars) {
        await setRepoSecret(
          githubToken,
          repoOwner,
          repoName,
          envVar.key,
          envVar.value
        );
      }
      console.log("   ✅ Custom env vars set");
    }
    
    // STEP 5: Set GitHub variable - ELEVEN_PROJECT_NAME
    console.log("📌 Step 5/8: Setting ELEVEN_PROJECT_NAME variable...");
    const varResult = await setRepoVariable(
      githubToken,
      repoOwner,
      repoName,
      "ELEVEN_PROJECT_NAME",
      cfProjectName
    );
    console.log(`   ✅ Variable ${varResult.action}`);
    
    // STEP 6: Commit workflow file
    console.log("📄 Step 6/8: Committing workflow file...");
    const workflowContent = getWorkflowTemplate(cfProjectName);
    const commitResult = await commitWorkflowFile(
      githubToken,
      repoOwner,
      repoName,
      workflowContent,
      workflowCheck.sha // Pass SHA if updating
    );
    console.log(`   ✅ Workflow ${workflowCheck.exists ? "updated" : "created"}`);
    
    // STEP 7: Save project to database
    console.log("💾 Step 7/8: Saving project to database...");
    const project = await createProject(db, {
      userId: user.id,
      name: repoName,
      repoOwner,
      repoName,
      productionBranch: defaultBranch,
      cfProjectName: cfProjectName,
      cfSubdomain: cfProject.subdomain,
    });
    console.log(`   ✅ Project saved with ID: ${project.id}`);
    
    // STEP 8: Invalidate repos cache
    console.log("♻️  Step 8/8: Invalidating repos cache...");
    await invalidateReposCache(db, user.id);
    console.log("   ✅ Cache invalidated");
    
    console.log(`\n✨ Deployment complete! Workflow will trigger automatically.\n`);
    
    // Return success response
    return Response.json({
      success: true,
      message: "Deployment triggered successfully!",
      project: {
        id: project.id,
        name: project.name,
        repoOwner: project.repoOwner,
        repoName: project.repoName,
        cfProjectName: project.cfProjectName,
        url: `https://${project.cfSubdomain}`,
        workflowUrl: `https://github.com/${repoOwner}/${repoName}/actions`,
      },
    });
  } catch (error) {
    console.error("❌ Deployment error:", error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
