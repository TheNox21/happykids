import React, { useState } from "react";
import { FolderTree, Copy, Check, FileCode, Server, Terminal, Network, Shield } from "lucide-react";

export default function ArchitectureTab() {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const folderStructure = `happy-cub-studio/
├── docker-compose.yml         # DevOps Container definitions (VPS Stack)
├── n8n-workflows/            # Automated pipelines (Story -> Voice -> YouTube)
│   ├── 01_story_generator.json
│   ├── 02_voice_producer.json
│   └── 03_youtube_publisher.json
├── server/                   # Full-Stack Node.js / Express backend
│   ├── server.ts             # API Controllers & Unified AI Router
│   ├── providers/            # Provider-independent adapter classes
│   │   ├── gemini.ts
│   │   ├── openai.ts
│   │   └── anthropic.ts
│   └── database/             # PostgreSQL database connection & schemas
├── src/                      # Vite + React Modern Dashboard
│   ├── App.tsx
│   ├── components/
│   ├── types.ts
│   └── index.css
├── package.json
└── tsconfig.json`;

  const dockerCompose = `version: '3.8'

services:
  # Happy Cub Content Production Dashboard & API proxy
  happy-cub-app:
    image: node:20-alpine
    container_name: happy-cub-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_URL=postgresql://cub_admin:secure_pass@postgres-db:5432/happy_cub_db
      - GEMINI_API_KEY=\${GEMINI_API_KEY}
      - OPENAI_API_KEY=\${OPENAI_API_KEY}
    volumes:
      - .:/app
    working_dir: /app
    command: npm run start
    depends_on:
      - postgres-db

  # Relational Database for structured content and character state
  postgres-db:
    image: postgres:15-alpine
    container_name: postgres-db
    restart: unless-stopped
    environment:
      - POSTGRES_USER=cub_admin
      - POSTGRES_PASSWORD=secure_pass
      - POSTGRES_DB=happy_cub_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # n8n Automation Engine running on Hostinger VPS
  n8n-automation:
    image: docker.n8n.io/n8nio/n8n:latest
    container_name: n8n-automation
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - N8N_PORT=5678
      - N8N_SECURE_COOKIE=false
      - WEBHOOK_URL=http://your-vps-ip:5678/
    volumes:
      - n8n_data:/home/node/.n8n

volumes:
  postgres_data:
  n8n_data:`;

  const apiEndpoints = [
    {
      method: "GET",
      path: "/api/v1/health",
      desc: "Retrieve local container cluster indicators, RAM usage, and VPS disk metrics.",
      payload: null
    },
    {
      method: "POST",
      path: "/api/v1/ai/generate",
      desc: "Provider-independent AI invocation router. Returns structured story scripts.",
      payload: `{
  "provider": "Gemini",
  "model": "gemini-3.5-flash",
  "prompt": "Create a bedtime story about Oliver...",
  "systemInstruction": "Keep sentences short for children under 5.",
  "responseFormat": "json"
}`
    },
    {
      method: "POST",
      path: "/api/v1/webhook/trigger",
      desc: "Inbound webhook called by the n8n automation scheduler to process story feeds.",
      payload: `{
  "storyId": "story-123",
  "action": "Trigger Audio Generation",
  "payload": { "voice": "Kore", "speed": 1.0 }
}`
    }
  ];

  return (
    <div id="architecture-tab-root" className="space-y-8">
      {/* Overview Banner */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/25">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-display font-semibold text-zinc-100 mb-1">VPS & DevOps Architecture Blueprint</h2>
            <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Happy Cub Studio is architected for self-hosting on your Hostinger VPS. It bypasses heavy monthly subscriptions by consolidating your workflows in lightweight Docker containers connected directly to n8n.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Modular Folder Design */}
        <div className="bg-[#121214] border border-[#27272a] rounded-xl p-6 flex flex-col h-full">
          <div className="flex items-center justify-between pb-4 border-b border-[#27272a] mb-4">
            <div className="flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-display font-medium text-zinc-200">Modular Workspace Layout</h3>
            </div>
            <button
              onClick={() => handleCopy(folderStructure, "folders")}
              className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-md transition-all flex items-center gap-1.5 text-xs"
            >
              {copiedText === "folders" ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Tree</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-zinc-400 mb-4">
            A provider-agnostic modular repository designed for simple local upgrades and rapid n8n automation pulls.
          </p>
          <pre className="bg-[#18181b] border border-[#27272a] rounded-lg p-4 font-mono text-xs text-amber-300/95 overflow-auto flex-1 select-all leading-relaxed whitespace-pre max-h-[400px]">
            {folderStructure}
          </pre>
        </div>

        {/* Docker-Compose configuration */}
        <div className="bg-[#121214] border border-[#27272a] rounded-xl p-6 flex flex-col h-full">
          <div className="flex items-center justify-between pb-4 border-b border-[#27272a] mb-4">
            <div className="flex items-center gap-2">
              <FileCode className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-display font-medium text-zinc-200">docker-compose.yml</h3>
            </div>
            <button
              onClick={() => handleCopy(dockerCompose, "docker")}
              className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-md transition-all flex items-center gap-1.5 text-xs"
            >
              {copiedText === "docker" ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-zinc-400 mb-4">
            Deploy this stack to your VPS to boot Happy Cub Studio, the n8n scheduler, and the PostgreSQL database with single-command ease.
          </p>
          <pre className="bg-[#18181b] border border-[#27272a] rounded-lg p-4 font-mono text-xs text-zinc-300 overflow-auto flex-1 select-all leading-relaxed whitespace-pre max-h-[400px]">
            {dockerCompose}
          </pre>
        </div>
      </div>

      {/* REST API and Integrations documentation */}
      <div className="bg-[#121214] border border-[#27272a] rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#27272a]">
          <Terminal className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-display font-medium text-zinc-200">Automation API Gateway (n8n Ready)</h3>
        </div>
        <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
          n8n handles orchestration by making structured HTTP requests to your VPS server. These endpoints isolate core business logic (such as story formulation, character prompts, and channel analytics logging) from direct consumer layers.
        </p>

        <div className="space-y-6">
          {apiEndpoints.map((api, idx) => (
            <div key={idx} className="bg-[#18181b] border border-[#27272a] rounded-lg overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-zinc-900 border-b border-[#27272a]">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 text-xs font-mono font-bold rounded ${
                    api.method === "GET" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  }`}>
                    {api.method}
                  </span>
                  <span className="font-mono text-xs text-zinc-200 font-medium">{api.path}</span>
                </div>
                {api.payload && (
                  <button
                    onClick={() => handleCopy(api.payload!, `payload-${idx}`)}
                    className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded transition-all text-xs flex items-center gap-1"
                  >
                    {copiedText === `payload-${idx}` ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>Copy JSON</span>
                  </button>
                )}
              </div>
              <div className="p-4 space-y-3">
                <p className="text-xs text-zinc-400 leading-relaxed">{api.desc}</p>
                {api.payload && (
                  <pre className="bg-[#121214] border border-[#27272a] rounded p-3 font-mono text-[11px] text-amber-400/90 overflow-x-auto">
                    {api.payload}
                  </pre>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTO Checklist for Docker Deployment */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-display font-medium text-zinc-100">Production VPS Security Considerations</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-zinc-400 leading-relaxed">
          <div className="space-y-2">
            <h4 className="font-semibold text-zinc-200">🛡️ Network Isolation</h4>
            <p>Ensure port 5432 (Postgres) is NOT exposed publicly. Map it inside the docker network bridge so only happy-cub-app and n8n can access database threads.</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-zinc-200">🔑 Secret Management</h4>
            <p>Never commit raw API keys to GitHub. Write keys in a secure `.env` file on your Hostinger VPS, then reference them at run-time using Docker-Compose variables.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
