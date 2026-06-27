import React, { useState } from "react";
import { Sparkles, Smile, Zap, Server, Layout, Play, ExternalLink } from "lucide-react";
import StoriesTab from "./components/StoriesTab";
import CharactersTab from "./components/CharactersTab";
import AutomationTab from "./components/AutomationTab";
import ArchitectureTab from "./components/ArchitectureTab";

export default function App() {
  const [activeTab, setActiveTab] = useState<"stories" | "characters" | "automation" | "architecture">("stories");

  return (
    <div id="happy-cub-root" className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Navigation / Status Header */}
      <header id="header-bar" className="border-b border-[#27272a] bg-[#121214] sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Brand/Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <span className="font-display font-black text-zinc-950 text-lg tracking-tighter">🐻</span>
            </div>
            <div>
              <h1 className="text-base font-display font-bold tracking-tight text-zinc-100">Happy Cub Studio</h1>
              <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">YouTube Content Operating System</p>
            </div>
          </div>

          {/* Quick Stats Banner / Integration Nodes */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="bg-[#18181b] border border-[#27272a] px-3 py-1.5 rounded-lg flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-zinc-400 font-mono text-[11px]">n8n VPS Integration:</span>
              <span className="text-emerald-400 font-medium font-mono text-[10px]">Active</span>
            </div>

            <div className="bg-[#18181b] border border-[#27272a] px-3 py-1.5 rounded-lg flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-zinc-400 font-mono text-[11px]">Docker Cluster:</span>
              <span className="text-zinc-200 font-medium font-mono text-[10px]">Healthy</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Tab Switcher (Modern minimalist tabs styled as an elegant control board) */}
        <div id="tab-switcher" className="flex border-b border-[#27272a] mb-8 overflow-x-auto gap-2 md:gap-4 pb-px">
          <button
            onClick={() => setActiveTab("stories")}
            className={`pb-4 px-2 text-sm font-display font-medium transition-all relative flex items-center gap-2 cursor-pointer ${
              activeTab === "stories" ? "text-amber-400" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Story Production</span>
            {activeTab === "stories" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("characters")}
            className={`pb-4 px-2 text-sm font-display font-medium transition-all relative flex items-center gap-2 cursor-pointer ${
              activeTab === "characters" ? "text-amber-400" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Smile className="w-4 h-4" />
            <span>Character Directory</span>
            {activeTab === "characters" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("automation")}
            className={`pb-4 px-2 text-sm font-display font-medium transition-all relative flex items-center gap-2 cursor-pointer ${
              activeTab === "automation" ? "text-amber-400" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>n8n Webhook Logs</span>
            {activeTab === "automation" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("architecture")}
            className={`pb-4 px-2 text-sm font-display font-medium transition-all relative flex items-center gap-2 cursor-pointer ${
              activeTab === "architecture" ? "text-amber-400" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Server className="w-4 h-4" />
            <span>DevOps Architecture</span>
            {activeTab === "architecture" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />
            )}
          </button>
        </div>

        {/* Tab Panels */}
        <div className="min-h-[500px]">
          {activeTab === "stories" && <StoriesTab />}
          {activeTab === "characters" && <CharactersTab />}
          {activeTab === "automation" && <AutomationTab />}
          {activeTab === "architecture" && <ArchitectureTab />}
        </div>
      </main>

      {/* Footer Info bar */}
      <footer className="border-t border-[#1f1f23] mt-20 py-8 bg-[#0b0b0d]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-mono">
          <p>© 2026 Happy Cub Stories. Configured for VPS deployment via Hostinger Docker Compose.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-zinc-300 transition-all cursor-help flex items-center gap-1">
              <Layout className="w-3.5 h-3.5" />
              SaaS Operational OS
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
