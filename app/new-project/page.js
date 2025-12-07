// src/app/new-project/page.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewProject() {
  const router = useRouter();
  const [mode, setMode] = useState(null); // null, 'existing', 'create'
  
  if (!mode) {
    return <ProjectTypeSelector onSelect={setMode} />;
  }
  
  if (mode === 'create') {
    return <CreateNewProject onBack={() => setMode(null)} />;
  }
  
  return <SelectExistingRepo onBack={() => setMode(null)} />;
}

function ProjectTypeSelector({ onSelect }) {
  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">New Project</h1>
            <Link
              href="/dashboard"
              className="text-gray-400 hover:text-white transition"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">Choose How to Start</h2>
          <p className="text-gray-400">Deploy an existing repository or create a new project from scratch</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Deploy Existing Repo */}
          <button
            onClick={() => onSelect('existing')}
            className="group bg-gray-900 border-2 border-gray-800 rounded-2xl p-8 hover:border-blue-500 transition-all duration-300 text-left"
          >
            <div className="text-5xl mb-4">📂</div>
            <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-400 transition">
              Deploy Existing Repo
            </h3>
            <p className="text-gray-400 mb-6">
              Connect a repository from your GitHub account and deploy it instantly
            </p>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Fast deployment
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Existing codebase
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Auto-deploy on push
              </li>
            </ul>
          </button>
          
          {/* Create New Project */}
          <button
            onClick={() => onSelect('create')}
            className="group bg-gray-900 border-2 border-gray-800 rounded-2xl p-8 hover:border-purple-500 transition-all duration-300 text-left"
          >
            <div className="text-5xl mb-4">✨</div>
            <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-purple-400 transition">
              Create New Project
            </h3>
            <p className="text-gray-400 mb-6">
              Start fresh with templates or upload your own files to create a new repository
            </p>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Starter templates
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> File upload support
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> No Git knowledge needed
              </li>
            </ul>
          </button>
        </div>
      </main>
    </div>
  );
}

function CreateNewProject({ onBack }) {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: repo details, 2: template/upload
  const [loading, setLoading] = useState(false);
  
  // Step 1: Repository details
  const [repoName, setRepoName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  
  // Step 2: Template or upload
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  const templates = [
    { id: "static-html", name: "Static HTML Site", icon: "🌐", description: "Simple HTML, CSS, JS" },
    { id: "react-vite", name: "React + Vite", icon: "⚛️", description: "Modern React with Vite" },
    { id: "nextjs", name: "Next.js App", icon: "▲", description: "Next.js with App Router" },
  ];
  
  async function handleCreateRepo() {
    if (!repoName.trim()) {
      alert("Please enter a repository name");
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await fetch("/api/repos/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: repoName,
          description,
          isPrivate,
          templateId: selectedTemplate,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        alert(data.error || "Failed to create repository");
        return;
      }
      
      // Redirect to configure page
      router.push(`/new-project/configure?owner=${data.repository.owner}&name=${data.repository.name}&language=JavaScript`);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Create New Project</h1>
            <button
              onClick={onBack}
              className="text-gray-400 hover:text-white transition"
            >
              ← Back
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className={`flex items-center ${step >= 1 ? 'text-blue-500' : 'text-gray-600'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-800'}`}>
              1
            </div>
            <span className="ml-2">Repository Details</span>
          </div>
          <div className="w-16 h-0.5 bg-gray-800 mx-4"></div>
          <div className={`flex items-center ${step >= 2 ? 'text-purple-500' : 'text-gray-600'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-purple-500 text-white' : 'bg-gray-800'}`}>
              2
            </div>
            <span className="ml-2">Choose Template</span>
          </div>
        </div>
        
        {step === 1 && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
            <h2 className="text-xl font-bold text-white mb-6">Repository Details</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Repository Name *
                </label>
                <input
                  type="text"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  placeholder="my-awesome-project"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Only lowercase letters, numbers, and hyphens
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A brief description of your project"
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="isPrivate" className="text-sm text-gray-400">
                  Make this repository private
                </label>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!repoName.trim()}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next: Choose Template →
              </button>
            </div>
          </div>
        )}
        
        {step === 2 && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
            <h2 className="text-xl font-bold text-white mb-6">Choose a Template</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {templates.map(template => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`p-6 border-2 rounded-lg text-left transition ${
                    selectedTemplate === template.id
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="text-4xl mb-3">{template.icon}</div>
                  <h3 className="font-bold text-white mb-2">{template.name}</h3>
                  <p className="text-sm text-gray-400">{template.description}</p>
                </button>
              ))}
            </div>
            
            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="text-gray-400 hover:text-white transition"
              >
                ← Back
              </button>
              <button
                onClick={handleCreateRepo}
                disabled={loading || !selectedTemplate}
                className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create & Deploy →"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function SelectExistingRepo({ onBack }) {
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
            <button
              onClick={onBack}
              className="text-gray-400 hover:text-white transition"
            >
              ← Back
            </button>
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
