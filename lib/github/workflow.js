// src/lib/github/workflow.js
import { githubRequest } from "./client";

const WORKFLOW_PATH = ".github/workflows/eleven-deploy.yml";

/**
 * Check if workflow file exists in repository
 * @param {string} token - GitHub access token
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<Object>} { exists, sha }
 */
export async function checkWorkflowExists(token, owner, repo) {
  try {
    const { data, rateLimit } = await githubRequest(
      `/repos/${owner}/${repo}/contents/${WORKFLOW_PATH}`,
      token
    );
    
    return {
      exists: true,
      sha: data.sha,
      content: data.content,
      rateLimit,
    };
  } catch (error) {
    if (error.message.includes("404")) {
      return { exists: false, sha: null, content: null };
    }
    throw error;
  }
}

/**
 * Get the workflow file template
 * @param {string} projectName - Cloudflare Pages project name
 * @returns {string} YAML workflow content
 */
export function getWorkflowTemplate(projectName) {
  return `name: Eleven Deploy

on:
  push:
    branches:
      - main
      - master

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy to Cloudflare Pages
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Detect Package Manager
        id: detect-pm
        run: |
          if [ -f "yarn.lock" ]; then
            echo "manager=yarn" >> $GITHUB_OUTPUT
            echo "command=install" >> $GITHUB_OUTPUT
            echo "lock=yarn.lock" >> $GITHUB_OUTPUT
          elif [ -f "pnpm-lock.yaml" ]; then
            echo "manager=pnpm" >> $GITHUB_OUTPUT
            echo "command=install" >> $GITHUB_OUTPUT
            echo "lock=pnpm-lock.yaml" >> $GITHUB_OUTPUT
          else
            echo "manager=npm" >> $GITHUB_OUTPUT
            echo "command=ci" >> $GITHUB_OUTPUT
            echo "lock=package-lock.json" >> $GITHUB_OUTPUT
          fi

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: \${{ steps.detect-pm.outputs.manager }}

      - name: Setup pnpm
        if: steps.detect-pm.outputs.manager == 'pnpm'
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: \${{ steps.detect-pm.outputs.manager }} \${{ steps.detect-pm.outputs.command }}

      - name: Build
        run: \${{ steps.detect-pm.outputs.manager }} run build

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: \${{ secrets.ELEVEN_CF_TOKEN }}
          accountId: \${{ secrets.ELEVEN_ACCOUNT_ID }}
          command: pages deploy dist --project-name=\${{ vars.ELEVEN_PROJECT_NAME }}
`;
}

/**
 * Commit workflow file to repository
 * @param {string} token - GitHub access token
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} content - Workflow file content
 * @param {string|null} sha - Existing file SHA (for updates)
 * @returns {Promise<Object>} Commit result
 */
export async function commitWorkflowFile(token, owner, repo, content, sha = null) {
  const body = {
    message: sha
      ? "🔄 Update Eleven deployment workflow"
      : "🚀 Add Eleven deployment workflow",
    content: Buffer.from(content).toString("base64"),
  };
  
  // Include SHA if updating existing file
  if (sha) {
    body.sha = sha;
  }
  
  const { data, rateLimit } = await githubRequest(
    `/repos/${owner}/${repo}/contents/${WORKFLOW_PATH}`,
    token,
    {
      method: "PUT",
      body: JSON.stringify(body),
    }
  );
  
  return {
    success: true,
    commit: data.commit,
    rateLimit,
  };
}

/**
 * Get workflow runs for the Eleven deployment workflow
 * @param {string} token - GitHub access token
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} perPage - Number of results per page
 * @returns {Promise<Object>} Workflow runs
 */
export async function getWorkflowRuns(token, owner, repo, perPage = 10) {
  const { data, rateLimit } = await githubRequest(
    `/repos/${owner}/${repo}/actions/runs?per_page=${perPage}`,
    token
  );
  
  // Filter for Eleven deployment workflow
  const elevenRuns = data.workflow_runs.filter(
    (run) => run.name === "Eleven Deploy" || run.path === WORKFLOW_PATH
  );
  
  return {
    runs: elevenRuns.map((run) => ({
      id: run.id,
      status: run.status,           // queued, in_progress, completed
      conclusion: run.conclusion,   // success, failure, cancelled, null
      headSha: run.head_sha,
      headBranch: run.head_branch,
      event: run.event,
      createdAt: run.created_at,
      updatedAt: run.updated_at,
      url: run.html_url,
    })),
    rateLimit,
  };
}

/**
 * Get single workflow run details
 * @param {string} token - GitHub access token
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} runId - Workflow run ID
 * @returns {Promise<Object>} Run details
 */
export async function getWorkflowRun(token, owner, repo, runId) {
  const { data, rateLimit } = await githubRequest(
    `/repos/${owner}/${repo}/actions/runs/${runId}`,
    token
  );
  
  return {
    run: {
      id: data.id,
      status: data.status,
      conclusion: data.conclusion,
      headSha: data.head_sha,
      headBranch: data.head_branch,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      url: data.html_url,
    },
    rateLimit,
  };
}

/**
 * Get jobs for a workflow run
 * @param {string} token - GitHub access token
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} runId - Workflow run ID
 * @returns {Promise<Object>} Jobs list
 */
export async function getWorkflowJobs(token, owner, repo, runId) {
  const { data, rateLimit } = await githubRequest(
    `/repos/${owner}/${repo}/actions/runs/${runId}/jobs`,
    token
  );
  
  return {
    jobs: data.jobs.map((job) => ({
      id: job.id,
      name: job.name,
      status: job.status,
      conclusion: job.conclusion,
      startedAt: job.started_at,
      completedAt: job.completed_at,
      steps: job.steps?.map((step) => ({
        name: step.name,
        status: step.status,
        conclusion: step.conclusion,
      })),
    })),
    rateLimit,
  };
}

/**
 * Get logs for a specific job
 * @param {string} token - GitHub access token
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} jobId - Job ID
 * @returns {Promise<string>} Log content
 */
export async function getJobLogs(token, owner, repo, jobId) {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/jobs/${jobId}/logs`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch job logs: ${response.statusText}`);
  }
  
  const logs = await response.text();
  return logs;
}

/**
 * Get commit details
 * @param {string} token - GitHub access token
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} sha - Commit SHA
 * @returns {Promise<Object>} Commit details
 */
export async function getCommitDetails(token, owner, repo, sha) {
  const { data, rateLimit } = await githubRequest(
    `/repos/${owner}/${repo}/commits/${sha}`,
    token
  );
  
  return {
    commit: {
      sha: data.sha,
      message: data.commit.message,
      author: data.commit.author.name,
      date: data.commit.author.date,
      url: data.html_url,
    },
    rateLimit,
  };
}
