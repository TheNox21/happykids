import React, { useState, useEffect } from "react";
import { Server, Zap, Terminal, Copy, Check, RefreshCw, Cpu, Database, Activity, AlertTriangle, Play } from "lucide-react";
import { AutomationLog, SystemHealth } from "../types";

export default function AutomationTab() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [webhookAction, setWebhookAction] = useState("Story Created Event");

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const fetchHealthAndLogs = async () => {
    try {
      const hRes = await fetch("/api/v1/health");
      const hData = await hRes.json();
      setHealth(hData);

      const lRes = await fetch("/api/v1/automation-logs");
      const lData = await lRes.json();
      setLogs(lData);
    } catch (err) {
      console.error("Error loading system metrics:", err);
    }
  };

  useEffect(() => {
    fetchHealthAndLogs();
  }, []);

  const triggerWebhook = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/webhook/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyId: `story-gen-${Math.floor(Math.random() * 900) + 100}`,
          action: webhookAction,
          payload: {
            channel: "Happy Cub Stories YouTube",
            vpsWorkerNode: "node-vps-primary",
            scheduledBatch: "BedtimeStories_Daily"
          }
        })
      });
      const data = await res.json();
      // Reload logs immediately to show the new event on the timeline!
      fetchHealthAndLogs();
    } catch (err) {
      console.error("Error triggering automation webhook:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const n8nWebhookNodeJson = `{
  "parameters": {
    "httpMethod": "POST",
    "path": "happy-cub-production-trigger",
    "options": {
      "rawBody": true
    }
  },
  "id": "node-fc1c6a65-5cbb-49cc-84c4-72535099cb63",
  "name": "VPS Webhook Listener",
  "type": "n8n-nodes-base.webhook",
  "typeVersion": 1,
  "position": [250, 360]
}`;

  return (
    <div id="automation-tab-root" className="space-y-8">
      {/* Metrics Row */}
      {health && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#121214] border border-[#27272a] rounded-xl p-5 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">CPU Core Load</p>
              <p className="text-xl font-display font-semibold text-zinc-200 mt-0.5">{health.vps.cpuUsage}</p>
            </div>
          </div>

          <div className="bg-[#121214] border border-[#27272a] rounded-xl p-5 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">RAM Allocated</p>
              <p className="text-xl font-display font-semibold text-zinc-200 mt-0.5">{health.vps.ramUsage}</p>
            </div>
          </div>

          <div className="bg-[#121214] border border-[#27272a] rounded-xl p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">VPS SSD Capacity</p>
              <p className="text-xl font-display font-semibold text-zinc-200 mt-0.5">72GB / 120GB Free</p>
            </div>
          </div>

          <div className="bg-[#121214] border border-[#27272a] rounded-xl p-5 flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">Database Status</p>
              <p className="text-xs font-display font-semibold text-emerald-400 mt-0.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Connected
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Docker Nodes Status */}
      <div className="bg-[#121214] border border-[#27272a] rounded-xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#27272a] mb-6">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-display font-medium text-zinc-200">Hostinger VPS Docker Stack</h3>
          </div>
          <button
            onClick={fetchHealthAndLogs}
            className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-md transition-all flex items-center gap-1 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Poll Cluster</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#27272a] text-zinc-500 font-mono">
                <th className="pb-3 font-medium">Container Name</th>
                <th className="pb-3 font-medium">Internal Port</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">Resource Usage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]">
              {health?.vps.dockerContainers.map((container, idx) => (
                <tr key={idx} className="text-zinc-300">
                  <td className="py-3 font-mono font-medium text-amber-400">{container.name}</td>
                  <td className="py-3 font-mono text-zinc-400">{container.port} → host</td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono font-medium rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      {container.status}
                    </span>
                  </td>
                  <td className="py-3 text-right font-mono text-zinc-500">
                    {idx === 0 ? "1.8% CPU, 128MB" : idx === 1 ? "0.4% CPU, 92MB" : "0.1% CPU, 45MB"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* n8n Webhook Node Template */}
        <div className="bg-[#121214] border border-[#27272a] rounded-xl p-6 flex flex-col h-full">
          <div className="flex items-center justify-between pb-4 border-b border-[#27272a] mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-display font-medium text-zinc-200">n8n Listener Node JSON</h3>
            </div>
            <button
              onClick={() => handleCopy(n8nWebhookNodeJson, "n8n_node")}
              className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-md transition-all flex items-center gap-1.5 text-xs"
            >
              {copiedText === "n8n_node" ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Node JSON</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
            Copy this raw JSON payload, open your self-hosted n8n instance, and hit <b>Ctrl + V</b> directly on the canvas to import your custom Webhook trigger!
          </p>
          <pre className="bg-[#18181b] border border-[#27272a] rounded-lg p-4 font-mono text-xs text-zinc-300 overflow-auto flex-1 select-all leading-relaxed whitespace-pre max-h-[300px]">
            {n8nWebhookNodeJson}
          </pre>
        </div>

        {/* Webhook dispatcher and timeline simulator */}
        <div className="bg-[#121214] border border-[#27272a] rounded-xl p-6 flex flex-col h-full">
          <div className="pb-4 border-b border-[#27272a] mb-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-display font-medium text-zinc-200">Test Webhook Dispatcher</h3>
            </div>
          </div>
          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
            Simulate a real automated webhook firing from the application backend towards your self-hosted n8n VPS server, testing trigger callbacks instantly.
          </p>

          <div className="space-y-4 flex-1">
            <div>
              <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">Select Event Payload Trigger</label>
              <select
                value={webhookAction}
                onChange={(e) => setWebhookAction(e.target.value)}
                className="w-full bg-[#18181b] border border-[#27272a] text-zinc-300 text-xs rounded-lg p-2.5 focus:border-amber-500/50 outline-none"
              >
                <option value="Story Created Event">Story Created Event (Triggers Outline generation)</option>
                <option value="Video Generation Complete">Video Generation Complete (SEO Optimization pipeline)</option>
                <option value="Publish to Youtube Scheduled">Publish to Youtube Scheduled (Publish direct webhook)</option>
              </select>
            </div>

            <div className="pt-4">
              <button
                onClick={triggerWebhook}
                disabled={isLoading}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-800 text-zinc-950 font-medium font-display text-xs py-3 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Dispatched webhook...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-zinc-950" />
                    <span>Fire Simulated n8n Webhook</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Terminal logs of automation events */}
      <div className="bg-[#121214] border border-[#27272a] rounded-xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#27272a] mb-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-display font-medium text-zinc-200">DevOps Cluster Terminal Log</h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">Live Connection</span>
        </div>

        <div className="bg-[#0c0c0e] border border-zinc-800 rounded-lg p-4 font-mono text-[11px] space-y-3 max-h-[300px] overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-zinc-600">Waiting for automation webhooks or AI operations to log...</p>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="border-b border-[#1f1f23] pb-2 last:border-0 last:pb-0">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-zinc-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span className={`font-bold ${log.status === "success" ? "text-emerald-400" : log.status === "warning" ? "text-amber-400" : "text-rose-400"}`}>
                    {log.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-zinc-300 mt-1 font-sans">{log.event}</p>
                <pre className="text-zinc-500 mt-1 text-[10px] overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed bg-[#141416] p-2 rounded border border-[#1f1f23]">
                  {JSON.stringify(log.payload, null, 2)}
                </pre>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
