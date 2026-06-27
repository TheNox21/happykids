import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Google GenAI client (Server-Side only)
const geminiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (geminiApiKey) {
  ai = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
  console.log("Google GenAI client initialized successfully.");
} else {
  console.warn("GEMINI_API_KEY is not defined. AI features will fallback to simulation.");
}

// In-memory store for Stories, Characters, Prompts, and Automation logs
// In a real production Docker deploy, these would reside in PostgreSQL
interface Story {
  id: string;
  title: string;
  ageGroup: string;
  genre: string;
  moral: string;
  status: "Draft" | "Approved" | "Audio_Generated" | "Video_Generated" | "Published";
  providerUsed: string;
  modelUsed: string;
  storyContent?: string;
  scenes?: { sceneNumber: number; narrative: string; imagePrompt: string; voiceScript: string }[];
  seoMetadata?: { title: string; description: string; tags: string[] };
  createdAt: string;
}

interface Character {
  id: string;
  name: string;
  appearance: string;
  personality: string;
  backstory: string;
  imagePromptTemplate: string;
}

const stories: Story[] = [
  {
    id: "story-1",
    title: "Oliver the Little Bear's Big Adventure",
    ageGroup: "3-5",
    genre: "Adventure",
    moral: "Sharing makes everyone happy",
    status: "Published",
    providerUsed: "Gemini",
    modelUsed: "gemini-1.5-flash",
    storyContent: "Once upon a time, in the heart of the Whispering Woods, lived Oliver, a cute little cub with fluffy brown fur and bright inquisitive eyes. Oliver loved picking sweet forest berries, but today he found a golden honey jar...",
    scenes: [
      {
        sceneNumber: 1,
        narrative: "Oliver finds a glowing honey jar next to the giant oak tree.",
        imagePrompt: "A cute little brown bear cub with large innocent eyes, wearing a tiny red neck scarf, happily holding a glowing golden honey jar under a majestic sun-drenched oak tree, Pixar style, children's book illustration, highly detailed, warm lighting, 16:9 aspect ratio --ar 16:9",
        voiceScript: "Meet Oliver. He's a little bear with a big heart and a very rumbling tummy! Today, something magical was waiting for him under the ancient oak tree."
      },
      {
        sceneNumber: 2,
        narrative: "Oliver meets Beatrice the Bluebird and decides to share.",
        imagePrompt: "A fluffy little brown bear cub with a red neck scarf, sitting on soft grass, offering a spoonful of golden honey to a tiny, cheerful bluebird perched on a low tree branch, soft watercolor details, vibrant colors, 16:9 aspect ratio --ar 16:9",
        voiceScript: "Oliver wanted to eat it all! But then, he saw his friend Beatrice the Bluebird looking very hungry. Oliver smiled and decided to share."
      }
    ],
    seoMetadata: {
      title: "Oliver the Little Bear's Big Adventure 🐻 | Bedtime Stories for Kids",
      description: "Join Oliver the adorable little bear cub as he learns the joy of sharing in this heartwarming bedtime story for toddlers and kids. Subscribe to Happy Cub Stories!",
      tags: ["bedtime stories", "sharing stories for kids", "little bear adventure", "moral stories for children", "kids youtube story"]
    },
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
  }
];

const characters: Character[] = [
  {
    id: "char-1",
    name: "Oliver the Cub",
    appearance: "Fluffy brown cub, wide innocent eyes, wears a signature tiny red neck scarf",
    personality: "Curious, gentle, sometimes clumsy, always kind-hearted",
    backstory: "Loves exploring the Whispering Woods with his friends and hunting for sweet honey spots.",
    imagePromptTemplate: "A cute little fluffy brown bear cub, wide innocent glossy eyes, wearing a tiny red neck scarf, Pixar 3D render style, clean bright clay texture, soft studio lighting, isolated solid background --ar 16:9"
  },
  {
    id: "char-2",
    name: "Beatrice the Bluebird",
    appearance: "Vibrant sapphire feathers, tiny golden beak, wears a miniature yellow flower hat",
    personality: "Wise, cheerful, speaks in melodic chirps, highly observant",
    backstory: "The eyes and ears of the Whispering Woods, Beatrice keeps everyone safe from up high.",
    imagePromptTemplate: "A tiny cute round bluebird, bright sapphire feathers, gold beak, wearing a small yellow flower crown on its head, sitting on a forest branch, cute Pixar 3D style, soft details, beautiful lighting --ar 16:9"
  }
];

const automationLogs: { timestamp: string; event: string; status: "success" | "warning" | "error"; payload: any }[] = [
  {
    timestamp: new Date().toISOString(),
    event: "n8n Webhook Received: Trigger Story Production",
    status: "success",
    payload: { trigger: "Manual Dashboard Push", storyId: "story-1", targetPlatform: "YouTube Kids" }
  }
];

// --- API ROUTES ---

// 1. Health and VPS Simulation status (Great for DevOps & Automation overview)
app.get("/api/v1/health", (req, res) => {
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

// 2. Story Database APIs (Exposed for n8n orchestrations)
app.get("/api/v1/stories", (req, res) => {
  res.json(stories);
});

app.post("/api/v1/stories", (req, res) => {
  const { title, ageGroup, genre, moral, status } = req.body;
  if (!title) {
    return res.status(400).json({ error: "Story Title is required" });
  }
  const newStory: Story = {
    id: `story-${Date.now()}`,
    title,
    ageGroup: ageGroup || "3-5",
    genre: genre || "Adventure",
    moral: moral || "Kindness",
    status: status || "Draft",
    providerUsed: "Gemini",
    modelUsed: process.env.GEMINI_MODEL || "gemini-1.5-flash",
    createdAt: new Date().toISOString()
  };
  stories.push(newStory);
  res.status(201).json({ message: "Story created successfully", story: newStory });
});

// 3. Character Database APIs
app.get("/api/v1/characters", (req, res) => {
  res.json(characters);
});

app.post("/api/v1/characters", (req, res) => {
  const { name, appearance, personality, backstory, imagePromptTemplate } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Character name is required" });
  }
  const newChar: Character = {
    id: `char-${Date.now()}`,
    name,
    appearance: appearance || "",
    personality: personality || "",
    backstory: backstory || "",
    imagePromptTemplate: imagePromptTemplate || ""
  };
  characters.push(newChar);
  res.status(201).json({ message: "Character logged successfully", character: newChar });
});

// 4. n8n Automation logs
app.get("/api/v1/automation-logs", (req, res) => {
  res.json(automationLogs);
});

// 5. Trigger Webhook simulated from client
app.post("/api/v1/webhook/trigger", (req, res) => {
  const { storyId, action, payload } = req.body;
  const logEntry = {
    timestamp: new Date().toISOString(),
    event: `n8n Webhook: ${action || "Trigger Workflow"}`,
    status: "success" as const,
    payload: { storyId, ...payload, processedBy: "n8n_vps_agent" }
  };
  automationLogs.unshift(logEntry);
  res.json({
    message: "Automation webhook successfully dispatched to VPS n8n engine",
    webhookReceived: true,
    n8nStatus: "running",
    executionId: `n8n-exec-${Math.floor(Math.random() * 1000000)}`,
    loggedEvent: logEntry
  });
});

// 6. Unified AI Generation Route (Provider Independent Backend proxy)
// We will use the Google GenAI SDK to make real API requests!
app.post("/api/v1/ai/generate", async (req, res) => {
  const { provider, model, prompt, systemInstruction, responseFormat } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  // Determine actual model to run
  const defaultModel = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const selectedModel = provider === "Gemini" ? (model === "gemini-pro" ? "gemini-3.1-pro-preview" : defaultModel) : (model || defaultModel);

  // Record an automation log
  automationLogs.unshift({
    timestamp: new Date().toISOString(),
    event: `AI Generation Requested [${provider} - ${selectedModel}]`,
    status: "success",
    payload: { promptSnippet: prompt.substring(0, 100) + "...", responseFormat }
  });

  // If Google Gemini is selected AND we have initialized the SDK client
  if (provider === "Gemini" && ai) {
    try {
      const config: any = {
        temperature: 0.8,
      };

      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }

      if (responseFormat === "json") {
        config.responseMimeType = "application/json";
        // Let's specify a nice structured schema for children stories to make it extremely beautiful!
        config.responseSchema = {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            moral: { type: Type.STRING },
            introduction: { type: Type.STRING },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sceneNumber: { type: Type.INTEGER },
                  narrative: { type: Type.STRING },
                  imagePrompt: { type: Type.STRING },
                  voiceScript: { type: Type.STRING }
                },
                required: ["sceneNumber", "narrative", "imagePrompt", "voiceScript"]
              }
            },
            youtube: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                tags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ["title", "description", "tags"]
            }
          },
          required: ["title", "moral", "introduction", "scenes", "youtube"]
        };
      }

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: prompt,
        config: config
      });

      const text = response.text || "";
      
      let storyJson = null;
      if (responseFormat === "json" && text) {
        try {
          const parsed = JSON.parse(text);
          storyJson = {
            id: `HCS-${Math.floor(100000 + Math.random() * 900000)}`,
            title: parsed.title,
            moral: parsed.moral,
            introduction: parsed.introduction,
            scenes: parsed.scenes,
            youtube: parsed.youtube
          };
        } catch (parseError) {
          console.warn("Could not parse returned story JSON:", parseError);
        }
      }

      return res.json({
        success: true,
        provider: "Gemini",
        model: selectedModel,
        ...(storyJson ? { story: storyJson } : { text: text }),
        timestamp: new Date().toISOString()
      });

    } catch (err: any) {
      console.error("Gemini Generation Error:", err);
      automationLogs.unshift({
        timestamp: new Date().toISOString(),
        event: "Gemini Generation Failed",
        status: "error",
        payload: { error: err.message }
      });
      return res.status(500).json({ error: "Gemini API call failed: " + err.message });
    }
  }

  // Fallback / simulation for non-configured or non-Gemini providers
  // This keeps the workspace fully interactive and showcases the unified API architecture!
  setTimeout(() => {
    let mockResult = "";
    let storyJson = null;

    if (responseFormat === "json") {
      storyJson = {
        id: `HCS-${Math.floor(100000 + Math.random() * 900000)}`,
        title: `Adventure of Sparky the Cub (${provider} Mocked)`,
        moral: "Curiosity paired with caution leads to wondrous findings.",
        introduction: "Sparky was a curious bear cub who lived near a sparkling blue lake...",
        scenes: [
          {
            sceneNumber: 1,
            narrative: "Sparky spies a colorful rainbow touching the opposite side of the lake.",
            imagePrompt: `A vibrant watercolor children's illustration of a fluffy, cute golden bear cub with bright eyes looking across a glistening, turquoise-blue mountain lake towards a shimmering colorful rainbow, Pixar style, highly detailed, 16:9 --ar 16:9`,
            voiceScript: "Sparky loved colors. And today, the biggest, brightest rainbow was touching down right across the lake!"
          },
          {
            sceneNumber: 2,
            narrative: "Sparky builds a small raft from twigs to cross the warm waters.",
            imagePrompt: `A cute golden bear cub carefully placing logs together to build a small wood raft at the edge of a sparkling mountain lake, forest backdrop, children's book style, charming, 16:9 --ar 16:9`,
            voiceScript: "To reach the rainbow, Sparky needed a plan. He gathered soft twigs and sturdy branches to build his very first raft."
          }
        ],
        youtube: {
          title: "The Rainbow Lake Adventure 🐻 | Bedtime Stories for Kids",
          description: "Join Sparky the adorable little golden bear cub as he builds a raft to reach the magical rainbow!",
          tags: ["bedtime stories", "bear adventure", "sharing stories", "kids youtube"]
        }
      };
    } else {
      mockResult = `[Simulated response from ${provider} using ${selectedModel}]

Once upon a time, a little cub learned that the greatest stories are written together. This prompt was processed by Happy Cub Studio's unified AI provider layer.

PROMPT RECEIVED:
"${prompt}"

To activate live calls for this provider, mount its environment variable (e.g., OPENAI_API_KEY) inside your Hostinger VPS Docker-Compose config.`;
    }

    res.json({
      success: true,
      provider: provider,
      model: selectedModel,
      simulated: true,
      ...(storyJson ? { story: storyJson } : { text: mockResult }),
      timestamp: new Date().toISOString()
    });
  }, 1200);
});

// Update an existing story with generated output (Simulates automated workflow updates)
app.post("/api/v1/stories/update-generated", (req, res) => {
  const { id, storyContent, scenes, seoMetadata, status } = req.body;
  const index = stories.findIndex(s => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Story not found" });
  }

  stories[index] = {
    ...stories[index],
    storyContent: storyContent || stories[index].storyContent,
    scenes: scenes || stories[index].scenes,
    seoMetadata: seoMetadata || stories[index].seoMetadata,
    status: status || stories[index].status
  };

  automationLogs.unshift({
    timestamp: new Date().toISOString(),
    event: `Story Updated via API [ID: ${id}]`,
    status: "success",
    payload: { title: stories[index].title, status: stories[index].status }
  });

  res.json({ message: "Story content synchronized perfectly", story: stories[index] });
});


// --- VITE MIDDLEWARE SETUP ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite Development Server middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production static files server configured.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Happy Cub Studio] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
