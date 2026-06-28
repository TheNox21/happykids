import { Router } from "express";

const router = Router();

router.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    system: {
      os: "Alpine Linux (Docker Container Sim)",
      nodeVersion: process.version,
      database: "PostgreSQL (In-Memory Simulator)",
      n8nIntegration: "Active - Listening on /api/v1/webhook/*",
    },
    vps: {
      cpuUsage: "12%",
      ramUsage: "48% of 8GB",
      diskAvailable: "72GB of 120GB",
      dockerContainers: [
        { name: "happy-cub-app", status: "running", port: 3000 },
        { name: "n8n-automation", status: "running", port: 5678 },
        { name: "postgres-db", status: "running", port: 5432 }
      ]
    }
  });
});

export default router;
