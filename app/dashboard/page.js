// src/app/dashboard/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import Loading from "@/components/ui/Loading";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeDeployments: 0,
    successfulDeployments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Bulk invite state
  const [showBulkInvite, setShowBulkInvite] = useState(false);
  const [bulkUsername, setBulkUsername] = useState("");
  const [bulkRole, setBulkRole] = useState("viewer");
  const [bulkInviting, setBulkInviting] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  
  useEffect(() => {
    loadDashboard();
  }, []);
  
  async function loadDashboard() {
    try {
      // Check auth
      const userRes = await fetch("/api/auth/me");
      if (!userRes.ok) {
        router.push("/");
        return;
      }
      const userData = await userRes.json();
      setUser(userData.user);
      
      // Load projects
      const projectsRes = await fetch("/api/projects");
      const projectsData = await projectsRes.json();
      setProjects(projectsData.projects || []);
      
      // Load stats
      const statsRes = await fetch("/api/stats");
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats || {
          totalProjects: 0,
          activeDeployments: 0,
          successfulDeployments: 0,
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  
  async function handleLogout() {
    await fetch("/api/auth/logout");
    router.push("/");
  }
  
  // ✅ Add delete handler
  const handleProjectDelete = (projectId) => {
    setProjects(projects.filter(p => p.id !== projectId));
    loadDashboard(); // Refresh status here 
  };
  
  // Bulk invite handler
  async function handleBulkInvite(e) {
    e.preventDefault();
    
    if (!bulkUsername.trim()) {
      alert("Please enter a username");
      return;
    }
    
    setBulkInviting(true);
    setBulkResult(null);
    
    try {
      const res = await fetch("/api/projects/bulk-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: bulkUsername.trim(),
          role: bulkRole,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to invite user");
      }
      
      setBulkResult(data);
      setBulkUsername("");
      
      // Refresh dashboard after successful invite
      setTimeout(() => {
        loadDashboard();
      }, 1000);
    } catch (err) {
      alert(`❌ ${err.message}`);
    } finally {
      setBulkInviting(false);
    }
  }
  
  if (loading) {
    return <Loading full message="Loading dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar user={user} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="dashboard-hero mb-6">
          <div className="dashboard-header">
          <div className="dashboard-title">
            <h1>Workspace Dashboard</h1>
            <div className="dashboard-subtitle">Overview of your projects, deployments, and recent activity</div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-sm flex items-center gap-2">
              <span>👥</span>
              <span>{showBulkInvite ? "Hide" : "Bulk Invite"}</span>
            </Button>
            <Link href="/new-project">
              <Button variant="accent" className="px-4 py-2">+ New Project</Button>
            </Link>
          </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="stat-card">
            <div className="stat-row">
              <div className="stat-icon">📁</div>
              <div>
                <div className="stat-label">Total Projects</div>
                <div className="text-xs text-gray-400">All-time</div>
              </div>
            </div>
            <div className="stat-value">{stats.totalProjects}</div>
            <div className="stat-meta">Active repos, recent activity and more</div>
          </Card>

          <Card className="stat-card">
            <div className="stat-row">
              <div className="stat-icon">⚡️</div>
              <div>
                <div className="stat-label">Active Deployments</div>
                <div className="text-xs text-gray-400">Now</div>
              </div>
            </div>
            <div className="stat-value text-blue-400">{stats.activeDeployments}</div>
            <div className="stat-meta">Number of currently running deployments</div>
          </Card>

          <Card className="stat-card">
            <div className="stat-row">
              <div className="stat-icon">✅</div>
              <div>
                <div className="stat-label">Successful Deploys</div>
                <div className="text-xs text-gray-400">30d</div>
              </div>
            </div>
            <div className="stat-value text-green-400">{stats.successfulDeployments}</div>
            <div className="stat-meta">Completed deployments in the last 30 days</div>
          </Card>
        </div>
        
        {/* Bulk Invite Section */}
        {projects.some(p => p.isOwner) && (
          <div className="mb-8">
            {showBulkInvite && (
              <div className="mt-4 bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Invite Collaborator to All Projects
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Add a team member to all projects you own at once.
                </p>
                
                <form onSubmit={handleBulkInvite} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      GitHub Username
                    </label>
                    <Input
                      type="text"
                      value={bulkUsername}
                      onChange={(e) => setBulkUsername(e.target.value)}
                      placeholder="username"
                      disabled={bulkInviting}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Role
                    </label>
                    <select
                      value={bulkRole}
                      onChange={(e) => setBulkRole(e.target.value)}
                      disabled={bulkInviting}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="viewer">Viewer - View only</option>
                      <option value="maintainer">Maintainer - Can deploy & manage</option>
                    </select>
                  </div>
                  
                  <Button
                    type="submit"
                    variant="default"
                    disabled={bulkInviting || !bulkUsername.trim()}
                    className="px-6 py-2"
                  >
                    {bulkInviting ? "Inviting..." : "Invite to All Projects"}
                  </Button>
                </form>
                
                {bulkResult && (
                  <div className="mt-4 space-y-3">
                    <div className="p-4 bg-green-900/20 border border-green-600/30 rounded-lg">
                      <div className="text-green-400 font-medium mb-2">
                        ✅ {bulkResult.message}
                      </div>
                      <div className="text-sm text-gray-300 space-y-1">
                        <div>Total projects: {bulkResult.results.total}</div>
                        <div>✅ Successfully invited: {bulkResult.results.succeeded}</div>
                        {bulkResult.results.skipped > 0 && (
                          <div>⏭️ Skipped (already member): {bulkResult.results.skipped}</div>
                        )}
                        {bulkResult.results.failed > 0 && (
                          <div className="text-red-400">❌ Failed: {bulkResult.results.failed}</div>
                        )}
                      </div>
                    </div>
                    
                    {/* Show successful invites */}
                    {bulkResult.details.succeeded.length > 0 && (
                      <details className="bg-gray-800 rounded-lg p-3">
                        <summary className="cursor-pointer text-sm text-green-400 font-medium">
                          ✅ Successfully Invited ({bulkResult.details.succeeded.length})
                        </summary>
                        <ul className="mt-2 space-y-1 text-xs text-gray-300 ml-4">
                          {bulkResult.details.succeeded.map((item) => (
                            <li key={item.projectId}>• {item.projectName}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                    
                    {/* Show skipped projects */}
                    {bulkResult.details.skipped.length > 0 && (
                      <details className="bg-gray-800 rounded-lg p-3">
                        <summary className="cursor-pointer text-sm text-yellow-400 font-medium">
                          ⏭️ Skipped ({bulkResult.details.skipped.length})
                        </summary>
                        <ul className="mt-2 space-y-1 text-xs text-gray-300 ml-4">
                          {bulkResult.details.skipped.map((item) => (
                            <li key={item.projectId}>
                              • {item.projectName} - {item.reason}
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                    
                    {/* Show failed invites */}
                    {bulkResult.details.failed.length > 0 && (
                      <details open className="bg-red-900/20 border border-red-600/30 rounded-lg p-3">
                        <summary className="cursor-pointer text-sm text-red-400 font-medium">
                          ❌ Failed ({bulkResult.details.failed.length})
                        </summary>
                        <ul className="mt-2 space-y-2 text-xs text-gray-300 ml-4">
                          {bulkResult.details.failed.map((item) => (
                            <li key={item.projectId}>
                              <div className="font-medium text-white">• {item.projectName}</div>
                              <div className="text-red-400 ml-3">Error: {item.error}</div>
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Projects Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Projects</h2>
          <Link href="/new-project">
            <Button className="px-6 py-2">+ New Project</Button>
          </Link>
        </div>
        
        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
            <div className="text-gray-400 mb-4">No projects yet</div>
            <Link href="/new-project">
              <Button className="px-6 py-3">Deploy Your First Project</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* ✅ Pass onDelete handler */}
            {projects.map(project => (
                <ProjectCard 
                  key={project.id} 
                  project={project}
                  onDelete={handleProjectDelete}
                />
              ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ✅ Updated ProjectCard with delete functionality
function ProjectCard({ project, onDelete }) {
  const router = useRouter();
  
  const handleCardClick = (e) => {
    // Don't navigate if clicking delete button
    if (e.target.closest('.delete-button')) {
      return;
    }
    router.push(`/projects/${project.id}`);
  };
  
  const handleDelete = async (e) => {
    e.stopPropagation();
    
    if (!confirm(`Delete "${project.name}"?`)) {
      return;
    }
    
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });
      
      if (!res.ok) {
        throw new Error("Failed to delete");
      }
      
      onDelete(project.id);
      alert("✅ Project deleted!");
    } catch (err) {
      alert(`❌ Failed to delete: ${err.message}`);
    }
  };
  
  return (
    <div 
      onClick={handleCardClick}
      className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-white">
              {project.name}
            </h3>
            {!project.isOwner && (
              <span className="px-2 py-0.5 bg-purple-600/20 text-purple-400 text-xs rounded border border-purple-600/30">
                Shared
              </span>
            )}
          </div>
          <div className="text-sm text-gray-400">
            {project.repoOwner}/{project.repoName}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={project.status === 'success' ? 'success' : 'default'}>
            {project.status || 'active'}
          </Badge>
          {project.isOwner && (
            <Button
              onClick={handleDelete}
              className="delete-button text-sm"
              variant="ghost"
              title="Delete project"
            >
              <span className="text-red-400">🗑️</span>
            </Button>
          )}
        </div>
      </div>
      
      <div className="text-sm text-gray-400 mb-4">
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-blue-400 transition"
          onClick={(e) => e.stopPropagation()}
        >
          {project.cfSubdomain}
        </a>
      </div>
      
      <div className="text-xs text-gray-500">
        Created {new Date(project.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
}
