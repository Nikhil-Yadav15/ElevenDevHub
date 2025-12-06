// src/app/dashboard/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Fetch current user
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setUser(data.user);
        } else {
          router.push("/");
        }
      })
      .catch((error) => {
        console.error("Failed to fetch user:", error);
        router.push("/");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);
  
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }
  
  if (!user) {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-linear-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Eleven
          </h1>
          
          <div className="flex items-center gap-4">
            <img 
              src={user.avatarUrl} 
              alt={user.username}
              className="w-8 h-8 rounded-full"
            />
            <span className="text-sm text-gray-300">{user.username}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-white"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Welcome, {user.username}! 👋
          </h2>
          <p className="text-gray-400 mb-6">
            Your dashboard is ready. Repository list and deployment features coming in the next chunks!
          </p>
          <div className="bg-gray-700 rounded-lg p-4 inline-block">
            <p className="text-sm text-gray-300">User ID: {user.id}</p>
            <p className="text-sm text-gray-300">Email: {user.email || "Not public"}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
