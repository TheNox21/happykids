import React, { useState, useEffect } from "react";
import { Sparkles, Play, RefreshCw, Eye, AlertCircle, CheckCircle, FileText, Send, HelpCircle, ChevronRight, Check } from "lucide-react";
import { Story, Scene } from "../types";

export default function StoriesTab() {
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [generationLogs, setGenerationLogs] = useState<string>("");

  // Story Form State
  const [title, setTitle] = useState("");
  const [ageGroup, setAgeGroup] = useState("3-5");
  const [genre, setGenre] = useState("Adventure");
  const [moral, setMoral] = useState("Sharing and Kindness");
  const [provider, setProvider] = useState<"Gemini" | "OpenAI" | "Anthropic">("Gemini");
  const [model, setModel] = useState("gemini-3.5-flash");
  const [customPlot, setCustomPlot] = useState("");

  const [activePipelineStep, setActivePipelineStep] = useState<number | null>(null);
  const [pipelineStatus, setPipelineStatus] = useState<string>("");

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const res = await fetch("/api/v1/stories");
      const data = await res.json();
      setStories(data);
      if (data.length > 0 && !selectedStory) {
        setSelectedStory(data[0]);
      }
    } catch (err) {
      console.error("Failed to load stories:", err);
    }
  };

  const handleGenerateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setGenerationLogs("Initializing Content Production pipeline...\nTargeting provider: " + provider + "\nUsing model: " + model + "\n");

    try {
      const promptText = `Generate a children story outline with the following specifications:
Title Idea: ${title || "A Wonderful Day"}
Age Group: ${ageGroup}
Genre: ${genre}
Moral / Lesson: ${moral}
Custom plot elements: ${customPlot || "No specific details, use your creative imagination."}

Generate structured JSON output containing the exact scenes with sceneNumber, narrative description of what's happening, detailed imagePrompt (ideal for a 3D Pixar, watercolor, or children's book style image generator with aspect ratio --ar 16:9), and voiceScript (ideal for voice actors or text-to-speech generators).`;

      setGenerationLogs(prev => prev + "Sending instruction payload to unified AI model proxy...\n");

      const response = await fetch("/api/v1/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: provider,
          model: model,
          prompt: promptText,
          systemInstruction: "You are a professional children's book author and YouTube content producer. Create stories that are highly engaging, clean, and educational. Always provide your output as clean valid JSON.",
          responseFormat: "json"
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Generation request failed");
      }

      setGenerationLogs(prev => prev + "AI model generated response! Direct mapping structured story...\n");

      let parsedContent: any = {};
      if (result.story) {
        parsedContent = result.story;
        setGenerationLogs(prev => prev + "Structured story successfully retrieved and processed.\n");
      } else {
        try {
          parsedContent = JSON.parse(result.text);
          setGenerationLogs(prev => prev + "JSON validation complete. Injecting story outlines.\n");
        } catch (parseErr) {
          // Fallback if parsing fails or if it's markdown-wrapped JSON
          const rawText = result.text;
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedContent = JSON.parse(jsonMatch[0]);
            setGenerationLogs(prev => prev + "Extracted JSON from markdown block successfully.\n");
          } else {
            throw new Error("Could not parse structured JSON from the model response. Raw: " + rawText.substring(0, 200));
          }
        }
      }

      // Create new story on the server
      const createRes = await fetch("/api/v1/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: parsedContent.title || title || "Happy Adventure",
          ageGroup,
          genre,
          moral: parsedContent.moral || moral,
          status: "Approved"
        })
      });

      const createData = await createRes.json();
      const newStoryId = createData.story.id;

      // Update story with generated scenes and SEO recommendations
      const updateRes = await fetch("/api/v1/stories/update-generated", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newStoryId,
          storyContent: parsedContent.introduction || `Introduction of ${parsedContent.title || title}`,
          scenes: parsedContent.scenes || [],
          seoMetadata: parsedContent.youtube ? {
            title: parsedContent.youtube.title,
            description: parsedContent.youtube.description,
            tags: parsedContent.youtube.tags
          } : {
            title: `${parsedContent.title || title} 🐻 | Bedtime Stories for Children`,
            description: `Listen to the beautiful story: "${parsedContent.title || title}" and learn the values of ${parsedContent.moral || moral}. Perfect bedtime audio for toddlers.`,
            tags: ["bedtime story", "kids story", "children audio books", genre.toLowerCase(), moral.toLowerCase()]
          },
          status: "Approved"
        })
      });

      const finalStory = await updateRes.json();
      setGenerationLogs(prev => prev + "🎉 Content operating system finalized story schema mapping!\n");

      // Reload stories and select the newly created one!
      await fetchStories();
      setSelectedStory(finalStory.story);

      // Reset form
      setTitle("");
      setCustomPlot("");

    } catch (err: any) {
      setGenerationLogs(prev => prev + `❌ ERROR: ${err.message}\n`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerPipeline = async (storyId: string, step: number) => {
    setActivePipelineStep(step);
    setPipelineStatus("Contacting self-hosted n8n instance...");

    let eventAction = "";
    let nextStatus: "Draft" | "Approved" | "Audio_Generated" | "Video_Generated" | "Published" = "Approved";

    if (step === 1) {
      eventAction = "Trigger ElevenLabs Audio Generation";
      setPipelineStatus("Synthesizing voice actor narrator via ElevenLabs... (Simulated)");
      nextStatus = "Audio_Generated";
    } else if (step === 2) {
      eventAction = "Trigger Leonardo.ai Video Composition";
      setPipelineStatus("Leonardo rendering image prompts into gorgeous video frames... (Simulated)");
      nextStatus = "Video_Generated";
    } else if (step === 3) {
      eventAction = "Publish to YouTube API";
      setPipelineStatus("SEO tags injected! Uploading to YouTube Channel... (Simulated)");
      nextStatus = "Published";
    }

    try {
      const res = await fetch("/api/v1/webhook/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyId: storyId,
          action: eventAction,
          payload: {
            step,
            platform: "Hostinger VPS Docker",
            vpsWorkerID: "worker-n8n-01"
          }
        })
      });

      const updateRes = await fetch("/api/v1/stories/update-generated", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: storyId,
          status: nextStatus
        })
      });

      const updatedData = await updateRes.json();
      setSelectedStory(updatedData.story);
      fetchStories();

      setPipelineStatus("✓ Pipeline step ran successfully. Webhook logged.");
    } catch (err) {
      console.error(err);
      setPipelineStatus("❌ Webhook dispatch failed.");
    } finally {
      setTimeout(() => {
        setActivePipelineStep(null);
        setPipelineStatus("");
      }, 3000);
    }
  };

  return (
    <div id="stories-tab-root" className="grid grid-cols-1 xl:grid-cols-12 gap-8">
      {/* Left Column - Creator & Feed */}
      <div className="xl:col-span-5 space-y-8">
        {/* Story Generation Hub */}
        <div className="bg-[#121214] border border-[#27272a] rounded-xl p-6">
          <div className="flex items-center gap-2 pb-4 border-b border-[#27272a] mb-6">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-display font-medium text-zinc-100">Creative Production Studio</h3>
          </div>

          <form onSubmit={handleGenerateStory} className="space-y-4 text-xs">
            <div>
              <label className="block text-zinc-400 mb-1.5 font-medium">Story Title / Concept</label>
              <input
                type="text"
                placeholder="e.g. Oliver the Bear Finds a Golden Honey Jar"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-[#18181b] border border-[#27272a] text-zinc-200 rounded-lg p-2.5 focus:border-amber-500/50 outline-none placeholder:text-zinc-600 transition-all text-xs"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-zinc-400 mb-1.5 font-medium">Age Group</label>
                <select
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#27272a] text-zinc-300 rounded-lg p-2.5 outline-none focus:border-amber-500/50"
                >
                  <option value="2-3">Toddler (2-3)</option>
                  <option value="3-5">Pre-K (3-5)</option>
                  <option value="6-8">Primary (6-8)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1.5 font-medium">Genre</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#27272a] text-zinc-300 rounded-lg p-2.5 outline-none focus:border-amber-500/50"
                >
                  <option value="Adventure">Adventure</option>
                  <option value="Bedtime">Bedtime</option>
                  <option value="Animal Fable">Animal Fable</option>
                  <option value="Fantasy">Fantasy</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1.5 font-medium">Moral Value</label>
                <select
                  value={moral}
                  onChange={(e) => setMoral(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#27272a] text-zinc-300 rounded-lg p-2.5 outline-none focus:border-amber-500/50"
                >
                  <option value="Sharing and Kindness">Sharing</option>
                  <option value="Honesty">Honesty</option>
                  <option value="Courage">Courage</option>
                  <option value="Patience">Patience</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-400 mb-1.5 font-medium">AI Provider</label>
                <select
                  value={provider}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setProvider(val);
                    if (val === "Gemini") setModel("gemini-3.5-flash");
                    else if (val === "OpenAI") setModel("gpt-4o-mini");
                    else setModel("claude-3-haiku");
                  }}
                  className="w-full bg-[#18181b] border border-[#27272a] text-zinc-300 rounded-lg p-2.5 outline-none focus:border-amber-500/50"
                >
                  <option value="Gemini">Gemini (Active SDK Client)</option>
                  <option value="OpenAI">OpenAI (Simulated)</option>
                  <option value="Anthropic">Anthropic (Simulated)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1.5 font-medium">Model Preset</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#27272a] text-zinc-300 rounded-lg p-2.5 outline-none focus:border-amber-500/50"
                >
                  {provider === "Gemini" ? (
                    <>
                      <option value="gemini-3.5-flash">gemini-3.5-flash (Fast, Default)</option>
                      <option value="gemini-pro">gemini-3.1-pro-preview (Creative)</option>
                    </>
                  ) : provider === "OpenAI" ? (
                    <>
                      <option value="gpt-4o-mini">gpt-4o-mini</option>
                      <option value="gpt-4o">gpt-4o</option>
                    </>
                  ) : (
                    <>
                      <option value="claude-3-haiku">claude-3-haiku</option>
                      <option value="claude-3-5-sonnet">claude-3.5-sonnet</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1.5 font-medium">Plot / Character Notes (Optional)</label>
              <textarea
                rows={3}
                placeholder="Describe scene details, custom characters, or specific humor beats to include in the story draft..."
                value={customPlot}
                onChange={(e) => setCustomPlot(e.target.value)}
                className="w-full bg-[#18181b] border border-[#27272a] text-zinc-200 rounded-lg p-2.5 focus:border-amber-500/50 outline-none placeholder:text-zinc-600 transition-all text-xs resize-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-800 text-zinc-950 font-medium font-display py-3 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Orchestrating AI Creators...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 fill-zinc-950" />
                    <span>Generate Story Outline</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Dev Logs */}
          {generationLogs && (
            <div className="mt-4 bg-zinc-950 rounded-lg border border-zinc-800 p-3 font-mono text-[10px] text-amber-400/95 max-h-[140px] overflow-y-auto">
              <p className="font-semibold text-zinc-400 mb-1">STDOUT Stream:</p>
              <span className="whitespace-pre-line">{generationLogs}</span>
            </div>
          )}
        </div>

        {/* Saved stories list */}
        <div className="bg-[#121214] border border-[#27272a] rounded-xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#27272a] mb-4">
            <h3 className="text-base font-display font-medium text-zinc-100">Saved Stories Library</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-full">{stories.length} Items</span>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {stories.map((story) => (
              <button
                key={story.id}
                onClick={() => setSelectedStory(story)}
                className={`w-full text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                  selectedStory?.id === story.id
                    ? "bg-amber-500/5 border-amber-500/30 shadow-sm"
                    : "bg-[#18181b] border-[#27272a] hover:border-[#3f3f46]"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                    story.status === "Published" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                    story.status === "Video_Generated" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                    story.status === "Audio_Generated" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                    "bg-zinc-800 text-zinc-400 border border-zinc-700/50"
                  }`}>
                    {story.status.replace("_", " ")}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {new Date(story.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-zinc-200 line-clamp-1">{story.title}</h4>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-500">
                  <span>Age {story.ageGroup}</span>
                  <span>•</span>
                  <span>{story.genre}</span>
                  <span>•</span>
                  <span className="text-amber-400/80">{story.modelUsed}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column - Script & Pipeline Integration Details */}
      <div className="xl:col-span-7 space-y-8">
        {selectedStory ? (
          <div className="bg-[#121214] border border-[#27272a] rounded-xl p-6">
            {/* Header */}
            <div className="pb-4 border-b border-[#27272a] mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-display font-semibold text-zinc-100">{selectedStory.title}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-zinc-400">
                  <span className="text-amber-400 font-mono text-[11px]">Core Lesson:</span>
                  <span>{selectedStory.moral}</span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-zinc-500">Pipeline State:</span>
                <span className={`px-2.5 py-1 text-xs font-mono rounded font-semibold border ${
                  selectedStory.status === "Published" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                  selectedStory.status === "Video_Generated" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                  selectedStory.status === "Audio_Generated" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                  "bg-zinc-800 text-zinc-400 border-zinc-700/50"
                }`}>
                  {selectedStory.status.replace("_", " ")}
                </span>
              </div>
            </div>

            {/* Production Pipeline controls (Triggering webhooks) */}
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 mb-8">
              <h4 className="text-xs uppercase font-mono font-bold tracking-wider text-zinc-400 mb-4 flex items-center gap-1.5">
                <Send className="w-4 h-4 text-amber-400" />
                n8n Microservices Orchestration
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Step 1: Voice Script */}
                <div className="bg-[#121214] border border-[#27272a] rounded-lg p-3.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-zinc-500">STEP 01</span>
                      {selectedStory.status !== "Draft" && selectedStory.status !== "Approved" && (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <h5 className="text-xs font-semibold text-zinc-200 mb-1">Synthesize Voice</h5>
                    <p className="text-[10px] text-zinc-500 mb-3">ElevenLabs API triggers story reading with neural kid-friendly voice profiles.</p>
                  </div>
                  <button
                    onClick={() => triggerPipeline(selectedStory.id, 1)}
                    disabled={activePipelineStep !== null}
                    className="w-full py-2 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded border border-amber-500/30 text-[10px] font-semibold transition-all cursor-pointer"
                  >
                    {activePipelineStep === 1 ? "Synthesizing..." : "Dispatch Audio Hook"}
                  </button>
                </div>

                {/* Step 2: Video Composition */}
                <div className="bg-[#121214] border border-[#27272a] rounded-lg p-3.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-zinc-500">STEP 02</span>
                      {(selectedStory.status === "Video_Generated" || selectedStory.status === "Published") && (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <h5 className="text-xs font-semibold text-zinc-200 mb-1">Generate Video</h5>
                    <p className="text-[10px] text-zinc-500 mb-3">Leonardo AI builds watercolor keyframes, auto-stitched with audio tracks.</p>
                  </div>
                  <button
                    onClick={() => triggerPipeline(selectedStory.id, 2)}
                    disabled={activePipelineStep !== null || (selectedStory.status !== "Audio_Generated" && selectedStory.status !== "Video_Generated" && selectedStory.status !== "Published")}
                    className="w-full py-2 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:border-transparent rounded border border-amber-500/30 text-[10px] font-semibold transition-all cursor-pointer"
                  >
                    {activePipelineStep === 2 ? "Generating Frame..." : "Dispatch Video Hook"}
                  </button>
                </div>

                {/* Step 3: Publish */}
                <div className="bg-[#121214] border border-[#27272a] rounded-lg p-3.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-zinc-500">STEP 03</span>
                      {selectedStory.status === "Published" && (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <h5 className="text-xs font-semibold text-zinc-200 mb-1">YouTube Publish</h5>
                    <p className="text-[10px] text-zinc-500 mb-3">Pushes standard tags, optimized description list, and video asset to YouTube API.</p>
                  </div>
                  <button
                    onClick={() => triggerPipeline(selectedStory.id, 3)}
                    disabled={activePipelineStep !== null || selectedStory.status !== "Video_Generated"}
                    className="w-full py-2 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:border-transparent rounded border border-amber-500/30 text-[10px] font-semibold transition-all cursor-pointer"
                  >
                    {activePipelineStep === 3 ? "Uploading Video..." : "Publish to YouTube"}
                  </button>
                </div>
              </div>

              {pipelineStatus && (
                <div className="mt-4 bg-[#121214] border border-[#27272a] p-2.5 rounded-lg flex items-center gap-2 text-[10px] text-amber-300 font-mono">
                  <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                  <span>{pipelineStatus}</span>
                </div>
              )}
            </div>

            {/* Generated Output Showcase */}
            <div className="space-y-6">
              {/* Plot Intro */}
              {selectedStory.storyContent && (
                <div>
                  <h4 className="text-xs uppercase font-mono font-bold tracking-wider text-zinc-500 mb-2">Story Exposition</h4>
                  <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-xs text-zinc-300 leading-relaxed">
                    {selectedStory.storyContent}
                  </div>
                </div>
              )}

              {/* Story Scenes Map */}
              {selectedStory.scenes && selectedStory.scenes.length > 0 ? (
                <div>
                  <h4 className="text-xs uppercase font-mono font-bold tracking-wider text-zinc-500 mb-3">Visual Script Map & Scene Prompts</h4>
                  <div className="space-y-4">
                    {selectedStory.scenes.map((scene, index) => (
                      <div key={index} className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden text-xs">
                        {/* Scene Header */}
                        <div className="px-4 py-2 bg-zinc-900 border-b border-[#27272a] flex items-center justify-between">
                          <span className="font-mono text-amber-400 font-semibold">SCENE 0{scene.sceneNumber || index + 1}</span>
                          <span className="text-[10px] text-zinc-500">Visual Script</span>
                        </div>

                        {/* Scene Content */}
                        <div className="p-4 space-y-3">
                          <div>
                            <span className="text-[9px] font-mono text-zinc-500 uppercase block mb-1">Action Description</span>
                            <p className="text-zinc-200 text-xs leading-relaxed">{scene.narrative}</p>
                          </div>

                          <div className="p-2.5 bg-amber-500/[0.02] border border-amber-500/10 rounded">
                            <span className="text-[9px] font-mono text-amber-400 uppercase block mb-1">Voice Actor Narration</span>
                            <p className="text-zinc-300 font-medium italic">"{scene.voiceScript}"</p>
                          </div>

                          <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800 font-mono text-[10px]">
                            <span className="text-[9px] font-mono text-zinc-500 uppercase block mb-1">Midjourney / Leonardo Image Generation Prompt</span>
                            <span className="text-zinc-400 select-all leading-relaxed">{scene.imagePrompt}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-zinc-950 border border-zinc-800 rounded-xl">
                  <AlertCircle className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-xs text-zinc-500">No scene boards mapped to this draft. Fire the story generator above!</p>
                </div>
              )}

              {/* YouTube SEO package */}
              {selectedStory.seoMetadata && (
                <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
                  <h4 className="text-xs uppercase font-mono font-bold tracking-wider text-zinc-400 mb-3">YouTube Kids SEO Package</h4>
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-[9px] font-mono text-zinc-500 uppercase block mb-1">Optimized YouTube Video Title</span>
                      <p className="text-zinc-200 font-semibold">{selectedStory.seoMetadata.title}</p>
                    </div>

                    <div>
                      <span className="text-[9px] font-mono text-zinc-500 uppercase block mb-1">Metadata Description Box</span>
                      <p className="text-zinc-400 bg-zinc-950 border border-zinc-800 p-2.5 rounded leading-relaxed">{selectedStory.seoMetadata.description}</p>
                    </div>

                    <div>
                      <span className="text-[9px] font-mono text-zinc-500 uppercase block mb-1">SEO Target Tags</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {selectedStory.seoMetadata.tags.map((tag, i) => (
                          <span key={i} className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded font-mono text-[10px] border border-zinc-700/55">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-[#121214] border border-[#27272a] rounded-xl p-12 text-center">
            <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-zinc-300">No story selected</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto leading-relaxed">
              Generate a brand new storyline outline above or select an existing one from the library index.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
