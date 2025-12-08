// src/app/dashboard/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
    loadDashboard(); // Refresh stats
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading dashboard...</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-white">Eleven</h1>
              {user && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    className="w-8 h-8 rounded-full"
                  />
                  <span>{user.username}</span>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-white transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="text-gray-400 text-sm mb-2">Total Projects</div>
            <div className="text-3xl font-bold text-white">{stats.totalProjects}</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="text-gray-400 text-sm mb-2">Active Deployments</div>
            <div className="text-3xl font-bold text-blue-500">
              {stats.activeDeployments}
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="text-gray-400 text-sm mb-2">Successful Deploys</div>
            <div className="text-3xl font-bold text-green-500">
              {stats.successfulDeployments}
            </div>
          </div>
        </div>
        
        {/* Projects Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Projects</h2>
          <Link
            href="/new-project"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition"
          >
            + New Project
          </Link>
        </div>
        
        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
            <div className="text-gray-400 mb-4">No projects yet</div>
            <Link
              href="/new-project"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              Deploy Your First Project
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
          <StatusBadge status="success" />
          {project.isOwner && (
            <button
              onClick={handleDelete}
              className="delete-button text-red-400 hover:text-red-300 transition text-sm"
              title="Delete project"
            >
              🗑️
            </button>
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

function StatusBadge({ status }) {
  const colors = {
    success: "bg-green-500/10 text-green-500 border-green-500/20",
    failed: "bg-red-500/10 text-red-500 border-red-500/20",
    pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    building: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${colors[status] || colors.success}`}>
      {status || "active"}
    </span>
  );
}
