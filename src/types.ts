export interface Scene {
  sceneNumber: number;
  narrative: string;
  imagePrompt: string;
  voiceScript: string;
}

export interface SeoMetadata {
  title: string;
  description: string;
  tags: string[];
}

export interface Story {
  id: string;
  title: string;
  ageGroup: string;
  genre: string;
  moral: string;
  status: "Draft" | "Approved" | "Audio_Generated" | "Video_Generated" | "Published";
  providerUsed: string;
  modelUsed: string;
  storyContent?: string;
  scenes?: Scene[];
  seoMetadata?: SeoMetadata;
  createdAt: string;
}

export interface Character {
  id: string;
  name: string;
  appearance: string;
  personality: string;
  backstory: string;
  imagePromptTemplate: string;
}

export interface SystemHealth {
  status: string;
  timestamp: string;
  system: {
    os: string;
    nodeVersion: string;
    database: string;
    n8nIntegration: string;
  };
  vps: {
    cpuUsage: string;
    ramUsage: string;
    diskAvailable: string;
    dockerContainers: { name: string; status: string; port: number }[];
  };
}

export interface AutomationLog {
  timestamp: string;
  event: string;
  status: "success" | "warning" | "error";
  payload: any;
}

export type AIProvider = "Gemini" | "OpenAI" | "Anthropic" | "Ollama" | "OpenRouter";
