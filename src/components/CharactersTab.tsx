import React, { useState, useEffect } from "react";
import { Smile, CheckCircle, RefreshCw, UserPlus, Info, Sparkles, Copy, Check, ChevronRight } from "lucide-react";
import { Character } from "../types";

export default function CharactersTab() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [appearance, setAppearance] = useState("");
  const [personality, setPersonality] = useState("");
  const [backstory, setBackstory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    try {
      const res = await fetch("/api/v1/characters");
      const data = await res.json();
      setCharacters(data);
      if (data.length > 0 && !selectedChar) {
        setSelectedChar(data[0]);
      }
    } catch (err) {
      console.error("Error loading characters:", err);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);

    const generatedTemplate = `A cute fluffy children's 3D Pixar character of ${name}, ${appearance}, stylized clay render, clean studio lighting, warm background, isolated center, cinematic detail, 16:9 aspect ratio --ar 16:9`;

    try {
      const res = await fetch("/api/v1/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          appearance,
          personality,
          backstory,
          imagePromptTemplate: generatedTemplate
        })
      });

      const data = await res.json();
      await fetchCharacters();
      setSelectedChar(data.character);

      // Reset Form
      setName("");
      setAppearance("");
      setPersonality("");
      setBackstory("");
    } catch (err) {
      console.error("Failed to save character:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="characters-tab-root" className="grid grid-cols-1 xl:grid-cols-12 gap-8">
      {/* Left panel - Character registry & Entry */}
      <div className="xl:col-span-5 space-y-8">
        {/* Character Logger form */}
        <div className="bg-[#121214] border border-[#27272a] rounded-xl p-6">
          <div className="flex items-center gap-2 pb-4 border-b border-[#27272a] mb-6">
            <UserPlus className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-display font-medium text-zinc-100">Character & Asset Register</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-zinc-400 mb-1.5 font-medium">Character Name</label>
              <input
                type="text"
                placeholder="e.g. Sammy the Squirrel"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-[#18181b] border border-[#27272a] text-zinc-200 rounded-lg p-2.5 focus:border-amber-500/50 outline-none placeholder:text-zinc-600 transition-all text-xs"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1.5 font-medium">Visual Appearance (For Image Consistency)</label>
              <textarea
                rows={2}
                placeholder="Describe key visual accessories, fur color, clothing items, and eyes details..."
                value={appearance}
                onChange={(e) => setAppearance(e.target.value)}
                required
                className="w-full bg-[#18181b] border border-[#27272a] text-zinc-200 rounded-lg p-2.5 focus:border-amber-500/50 outline-none placeholder:text-zinc-600 transition-all text-xs resize-none"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1.5 font-medium">Personality Traits</label>
              <input
                type="text"
                placeholder="e.g. High energy, curious, likes jokes"
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
                className="w-full bg-[#18181b] border border-[#27272a] text-zinc-200 rounded-lg p-2.5 focus:border-amber-500/50 outline-none placeholder:text-zinc-600 transition-all text-xs"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1.5 font-medium">Brief Backstory</label>
              <textarea
                rows={2}
                placeholder="Loves gathering acorns and teaching others about the forest eco-system..."
                value={backstory}
                onChange={(e) => setBackstory(e.target.value)}
                className="w-full bg-[#18181b] border border-[#27272a] text-zinc-200 rounded-lg p-2.5 focus:border-amber-500/50 outline-none placeholder:text-zinc-600 transition-all text-xs resize-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-800 text-zinc-950 font-medium font-display py-3 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Writing database record...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 fill-zinc-950" />
                    <span>Register Character</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Saved Character Directory */}
        <div className="bg-[#121214] border border-[#27272a] rounded-xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#27272a] mb-4">
            <h3 className="text-base font-display font-medium text-zinc-100">Character Directory</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-full">{characters.length} Registered</span>
          </div>

          <div className="space-y-2.5">
            {characters.map((char) => (
              <button
                key={char.id}
                onClick={() => setSelectedChar(char)}
                className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                  selectedChar?.id === char.id
                    ? "bg-amber-500/5 border-amber-500/30"
                    : "bg-[#18181b] border-[#27272a] hover:border-[#3f3f46]"
                }`}
              >
                <div>
                  <h4 className="text-xs font-semibold text-zinc-200">{char.name}</h4>
                  <p className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5">{char.personality || "No personality traits logged."}</p>
                </div>
                <ChevronRight className={`w-4 h-4 text-zinc-500 transition-all ${selectedChar?.id === char.id ? "translate-x-0.5 text-amber-400" : ""}`} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - Prompt Tuning Engine (Pixel level alignment) */}
      <div className="xl:col-span-7">
        {selectedChar ? (
          <div className="bg-[#121214] border border-[#27272a] rounded-xl p-6 space-y-6">
            <div className="pb-4 border-b border-[#27272a]">
              <h2 className="text-lg font-display font-semibold text-zinc-100">{selectedChar.name}</h2>
              <p className="text-xs text-zinc-400 mt-1">Consistency engine preset metadata and prompt mapping logs</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Visual Appearance</span>
                  <p className="text-xs text-zinc-300 bg-zinc-950 border border-zinc-800 p-3.5 rounded-lg leading-relaxed">
                    {selectedChar.appearance}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Character Backstory</span>
                  <p className="text-xs text-zinc-400 bg-zinc-950 border border-zinc-800 p-3.5 rounded-lg leading-relaxed">
                    {selectedChar.backstory || "No backstory logged."}
                  </p>
                </div>
              </div>

              {/* Tips for YouTube Creators */}
              <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-display font-semibold text-zinc-200 mb-2.5 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-amber-400" />
                    YouTube Character Consistency Guide
                  </h4>
                  <ul className="text-[11px] text-zinc-400 space-y-2 leading-relaxed list-disc list-inside">
                    <li>Always define signature accessories (e.g., <i>"red scarf"</i>) to anchor image generators.</li>
                    <li>Reference 3D styles (Pixar, Disney, Claymation) for bright, clickable preschool content.</li>
                    <li>Use <b>--ar 16:9</b> as an explicit command flag for widescreen YouTube formats.</li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-[#27272a] mt-4">
                  <p className="text-[10px] font-mono text-zinc-500">Registered ID: <span className="text-amber-500">{selectedChar.id}</span></p>
                </div>
              </div>
            </div>

            {/* Prompt Tuning Board */}
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#27272a] mb-4">
                <span className="text-xs uppercase font-mono font-bold tracking-wider text-zinc-400">Consistent Midjourney/Leonardo Template</span>
                <button
                  onClick={() => handleCopy(selectedChar.imagePromptTemplate, "prompt")}
                  className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded transition-all text-xs flex items-center gap-1.5"
                >
                  {copiedText === "prompt" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Template</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-zinc-500 mb-4 leading-relaxed">
                Copy this pre-tuned prompt wrapper to keep SAMENESS across all children scenes generated during autonomous n8n runs.
              </p>

              <pre className="bg-[#121214] border border-[#27272a] rounded-lg p-3.5 font-mono text-xs text-amber-400/90 leading-relaxed whitespace-pre-wrap select-all">
                {selectedChar.imagePromptTemplate}
              </pre>
            </div>
          </div>
        ) : (
          <div className="bg-[#121214] border border-[#27272a] rounded-xl p-12 text-center">
            <Smile className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-zinc-300">No character selected</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Select or register a brand-new character avatar to begin tuning visual consistency prompts.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
