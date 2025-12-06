// src/app/new-project/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewProject() {
  const router = useRouter();
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [search, setSearch] = useState("");
  const [languageFilter, setLanguageFilter] = useState("all");
  
  useEffect(() => {
    loadRepos();
  }, []);
  
  async function loadRepos(forceRefresh = false) {
    try {
      setLoading(true);
      const url = forceRefresh 
        ? "/api/repos?refresh=true" 
        : "/api/repos";
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load repos");
      
      const data = await res.json();
      setRepos(data.repos || []);
      setFromCache(data.fromCache);
    } catch (error) {
      console.error("Load repos error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }
  
  async function handleRefresh() {
    setRefreshing(true);
    await loadRepos(true);
  }
  
  // Get unique languages
  const languages = ["all", ...new Set(repos.map(r => r.language).filter(Boolean))];
  
  // Filter repos
  const filteredRepos = repos.filter(repo => {
    const matchesSearch = repo.name.toLowerCase().includes(search.toLowerCase()) ||
                         repo.description?.toLowerCase().includes(search.toLowerCase());
    const matchesLanguage = languageFilter === "all" || repo.language === languageFilter;
    return matchesSearch && matchesLanguage;
  });
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading repositories...</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Select Repository</h1>
            <Link
              href="/dashboard"
              className="text-gray-400 hover:text-white transition"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cache Status & Refresh */}
        {fromCache && (
          <div className="mb-4 flex items-center justify-between bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-blue-400">
              <span>📦</span>
              <span>Showing cached repositories</span>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50 transition"
            >
              {refreshing ? "Refreshing..." : "🔄 Refresh"}
            </button>
          </div>
        )}
        
        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search repositories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          >
            {languages.map(lang => (
              <option key={lang} value={lang}>
                {lang === "all" ? "All Languages" : lang}
              </option>
            ))}
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50"
          >
            {refreshing ? "⏳ Refreshing..." : "🔄 Refresh List"}
          </button>
        </div>
        
        {/* Repos List */}
        <div className="space-y-4">
          {filteredRepos.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center text-gray-400">
              No repositories found
            </div>
          ) : (
            filteredRepos.map(repo => (
              <RepoCard key={repo.fullName} repo={repo} />
            ))
          )}
        </div>
      </main>
    </div>
  );
}

function RepoCard({ repo }) {
  const router = useRouter();
  
  function handleSelect() {
    router.push(`/new-project/configure?owner=${repo.owner}&name=${repo.name}`);
  }
  
  return (
    <div
      onClick={handleSelect}
      className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">
            {repo.name}
          </h3>
          {repo.description && (
            <p className="text-sm text-gray-400 mb-3">{repo.description}</p>
          )}
        </div>
        {repo.language && (
          <LanguageBadge language={repo.language} color={repo.languageColor} />
        )}
      </div>
      
      <div className="flex items-center gap-4 text-sm text-gray-500">
        {repo.stars > 0 && (
          <span className="flex items-center gap-1">
            ⭐ {repo.stars}
          </span>
        )}
        {repo.forks > 0 && (
          <span className="flex items-center gap-1">
            🔀 {repo.forks}
          </span>
        )}
        <span>Updated {formatDate(repo.updatedAt)}</span>
      </div>
    </div>
  );
}

function LanguageBadge({ language, color }) {
  return (
    <span className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-300">
      <span
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: color || "#888" }}
      />
      {language}
    </span>
  );
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}
