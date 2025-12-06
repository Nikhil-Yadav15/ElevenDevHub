// src/components/LogViewer.js
"use client";

import { useState, useEffect, useRef } from "react";

export default function LogViewer({ projectId, runId, status }) {
  const [logs, setLogs] = useState("");
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const logsEndRef = useRef(null);
  const intervalRef = useRef(null);
  
  const isActive = status === 'queued' || status === 'in_progress';
  
  async function fetchLogs() {
    try {
      const res = await fetch(`/api/projects/${projectId}/deployments/${runId}/logs`);
      if (!res.ok) throw new Error("Failed to fetch logs");
      
      const data = await res.json();
      setLogs(data.logs || "");
      setSteps(data.steps || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  
  // Initial fetch
  useEffect(() => {
    if (isExpanded) {
      fetchLogs();
    }
  }, [isExpanded]);
  
  // Poll logs while deployment is active
  useEffect(() => {
    if (!isExpanded) return;
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    if (isActive) {
      console.log(`📡 Polling logs every 5s for deployment ${runId}`);
      intervalRef.current = setInterval(fetchLogs, 5000);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isExpanded]);
  
  // Auto-scroll to bottom when logs update
  useEffect(() => {
    if (isExpanded && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, isExpanded]);
  
  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="text-sm text-blue-400 hover:text-blue-300 transition mt-3"
      >
        📄 View Logs
      </button>
    );
  }
  
  return (
    <div className="mt-4 border border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">Build Logs</span>
          {isActive && (
            <span className="text-xs text-blue-400 animate-pulse">● Live</span>
          )}
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-400 hover:text-white transition"
        >
          ✕
        </button>
      </div>
      
      {/* Steps Progress */}
      {steps.length > 0 && (
        <div className="bg-gray-800/50 px-4 py-3 border-b border-gray-700">
          <div className="space-y-2">
            {steps.map((step, index) => (
              <StepItem key={index} step={step} />
            ))}
          </div>
        </div>
      )}
      
      {/* Logs Content */}
      <div className="bg-gray-950 p-4 max-h-96 overflow-y-auto font-mono text-xs">
        {loading ? (
          <div className="text-gray-400">Loading logs...</div>
        ) : error ? (
          <div className="text-red-400">Error: {error}</div>
        ) : logs ? (
          <pre className="text-gray-300 whitespace-pre-wrap">{logs}</pre>
        ) : (
          <div className="text-gray-400">No logs available yet</div>
        )}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
}

function StepItem({ step }) {
  const statusConfig = {
    queued: { icon: "⏳", color: "text-yellow-500" },
    in_progress: { icon: "🔄", color: "text-blue-500" },
    completed: {
      success: { icon: "✅", color: "text-green-500" },
      failure: { icon: "❌", color: "text-red-500" },
      skipped: { icon: "⏭️", color: "text-gray-500" },
    },
  };
  
  const getConfig = () => {
    if (step.status === 'completed') {
      return statusConfig.completed[step.conclusion] || statusConfig.completed.success;
    }
    return statusConfig[step.status] || statusConfig.queued;
  };
  
  const config = getConfig();
  
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={config.color}>{config.icon}</span>
      <span className="text-gray-300">{step.name}</span>
      {step.status === 'in_progress' && (
        <span className="text-xs text-blue-400 animate-pulse">running...</span>
      )}
    </div>
  );
}
