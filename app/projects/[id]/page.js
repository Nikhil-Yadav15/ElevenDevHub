// src/app/projects/[id]/page.js
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useDeploymentPolling } from "@/hooks/useDeploymentPolling";
import LogViewer from "@/components/LogViewer";

export default function ProjectDetail() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const {
    deployments,
    loading: deploymentsLoading,
    error: deploymentsError,
    fromCache,
    refresh,
  } = useDeploymentPolling(params.id);
  
  useEffect(() => {
    loadProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  async function loadProject() {
    try {
      const res = await fetch(`/api/projects/${params.id}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("Project not found");
          return;
        }
        throw new Error("Failed to load project");
      }
      
      const data = await res.json();
      setProject(data.project);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading project...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">{error}</div>
          <Link href="/dashboard" className="text-blue-400 hover:text-blue-300">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }
  
  const latestDeployment = deployments[0];
  
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">{project.name}</h1>
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300 transition"
              >
                {project.cfSubdomain} →
              </a>
            </div>
            <Link
              href="/dashboard"
              className="text-gray-400 hover:text-white transition"
            >
              ← Back
            </Link>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Info */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-gray-400 mb-1">Repository</div>
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-blue-400 transition font-mono text-sm"
              >
                {project.repoOwner}/{project.repoName}
              </a>
            </div>
            
            <div>
              <div className="text-sm text-gray-400 mb-1">Branch</div>
              <div className="text-white text-sm">{project.productionBranch}</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-400 mb-1">Actions</div>
              <a
                href={project.workflowUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition text-sm"
              >
                View on GitHub →
              </a>
            </div>
          </div>
        </div>
        
        {/* Latest Deployment */}
        {latestDeployment && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Latest Deployment</h2>
              {fromCache && (
                <button
                  onClick={refresh}
                  className="text-sm text-gray-400 hover:text-white transition"
                >
                  🔄 Refresh
                </button>
              )}
            </div>
            
            <DeploymentCard 
              deployment={latestDeployment} 
              isLatest 
              projectId={project.id}
            />
          </div>
        )}
        
        {/* Deployment History */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">
              Recent Deployments ({deployments.length})
            </h2>
          </div>
          
          {deploymentsLoading && deployments.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              Loading deployments...
            </div>
          ) : deploymentsError ? (
            <div className="text-center py-12 text-red-500">
              {deploymentsError}
            </div>
          ) : deployments.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No deployments yet
            </div>
          ) : (
            <div className="space-y-3">
              {deployments.map((deployment, index) => (
                <DeploymentCard
                  key={deployment.id}
                  deployment={deployment}
                  isLatest={index === 0}
                  projectId={project.id}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function DeploymentCard({ deployment, isLatest, projectId }) {
  const statusConfig = {
    queued: {
      color: "yellow",
      icon: "⏳",
      label: "Queued",
      bg: "bg-yellow-500/10",
      text: "text-yellow-500",
      border: "border-yellow-500/20",
    },
    in_progress: {
      color: "blue",
      icon: "🔄",
      label: "Building",
      bg: "bg-blue-500/10",
      text: "text-blue-500",
      border: "border-blue-500/20",
    },
    completed: {
      success: {
        color: "green",
        icon: "✅",
        label: "Success",
        bg: "bg-green-500/10",
        text: "text-green-500",
        border: "border-green-500/20",
      },
      failure: {
        color: "red",
        icon: "❌",
        label: "Failed",
        bg: "bg-red-500/10",
        text: "text-red-500",
        border: "border-red-500/20",
      },
      cancelled: {
        color: "gray",
        icon: "🚫",
        label: "Cancelled",
        bg: "bg-gray-500/10",
        text: "text-gray-500",
        border: "border-gray-500/20",
      },
    },
  };
  
  const getStatusConfig = () => {
    if (deployment.status === "completed") {
      return (
        statusConfig.completed[deployment.conclusion] ||
        statusConfig.completed.success
      );
    }
    return statusConfig[deployment.status] || statusConfig.queued;
  };
  
  const config = getStatusConfig();
  
  return (
    <div
      className={`border ${config.border} ${config.bg} rounded-lg p-4 ${
        isLatest ? "ring-2 ring-blue-500/20" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium border ${config.border} ${config.bg} ${config.text}`}
          >
            {config.icon} {config.label}
          </span>
          <span className="text-sm text-gray-400">
            {formatTimestamp(deployment.createdAt)}
          </span>
        </div>
        <a
          href={deployment.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-gray-400 hover:text-blue-400 transition"
        >
          View →
        </a>
      </div>
      
      <div className="mb-2">
        <div className="text-white font-medium mb-1">
          {deployment.commit.message.split("\n")[0]}
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <span>by {deployment.commit.author}</span>
          <span>•</span>
          <a
            href={deployment.commit.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono hover:text-blue-400 transition"
          >
            {deployment.commit.sha}
          </a>
        </div>
      </div>
      
      {deployment.status === "in_progress" && (
        <div className="mt-3">
          <div className="flex items-center gap-2 text-sm text-blue-400 mb-2">
            <div className="animate-spin">🔄</div>
            <span>Building...</span>
          </div>
        </div>
      )}

      {/* Logs */}
      <LogViewer 
        projectId={projectId} 
        runId={deployment.id} 
        status={deployment.status}
      />
    </div>
  );
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString();
}
