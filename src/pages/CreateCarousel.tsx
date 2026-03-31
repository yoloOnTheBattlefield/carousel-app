import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { useGenerateCarousel } from "@/hooks/useCarousels";
import { useSelectedClient } from "@/contexts/ClientContext";
import { VoiceInput } from "@/components/shared/VoiceInput";
import type { CarouselGoal } from "@/types";

const GOALS: Array<{ value: CarouselGoal; label: string; desc: string }> = [
  { value: "saveable_educational", label: "Educational", desc: "Maximize saves — real value people bookmark" },
  { value: "polarizing_authority", label: "Authority", desc: "Bold takes that spark debate" },
  { value: "emotional_story", label: "Story", desc: "Emotional connection through vulnerability" },
  { value: "conversion_focused", label: "Conversion", desc: "Drive DMs — agitate, solve, CTA" },
];

export default function CreateCarousel() {
  const navigate = useNavigate();
  const { selectedClientId, selectedClient } = useSelectedClient();
  const [topic, setTopic] = useState("");
  const [goal, setGoal] = useState<CarouselGoal>("saveable_educational");
  const [slideCount, setSlideCount] = useState<number | null>(null);
  const [instructions, setInstructions] = useState("");

  const generate = useGenerateCarousel();

  async function handleGenerate() {
    if (!selectedClientId || !topic.trim()) return;
    const result = await generate.mutateAsync({
      client_id: selectedClientId,
      topic: topic.trim(),
      goal,
      slide_count: slideCount || undefined,
      additional_instructions: instructions.trim() || undefined,
    });
    navigate(`/carousels/${result.carousel._id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center justify-center w-9 h-9 rounded-xl border border-[#222] text-[#555] hover:text-white hover:border-[#333] transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-[28px] font-bold text-white tracking-tight">New Carousel</h1>
          <p className="text-[#555] text-[14px] mt-1">
            {selectedClient ? `Creating for ${selectedClient.name}` : "Select a client from the sidebar"}
          </p>
        </div>
      </div>

      <div className="max-w-xl mx-auto space-y-6">
        {/* Topic */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[12px] text-[#555] font-medium uppercase tracking-wider">Topic</label>
            <VoiceInput
              onTranscript={(text) => setTopic((prev) => prev ? `${prev} ${text}` : text)}
              disabled={generate.isPending}
            />
          </div>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder='Type or use voice — e.g. "5 AI tools that replaced my entire tech stack"'
            rows={3}
            className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-[#333] focus:border-[#c9a84c] focus:outline-none transition-colors resize-none"
          />
        </div>

        {/* Goal */}
        <div>
          <label className="text-[12px] text-[#555] font-medium uppercase tracking-wider mb-2 block">Goal</label>
          <div className="grid grid-cols-2 gap-2">
            {GOALS.map((g) => (
              <button
                key={g.value}
                onClick={() => setGoal(g.value)}
                className={`rounded-xl border p-3 text-left transition-all cursor-pointer ${
                  goal === g.value
                    ? "border-[#c9a84c] bg-[#c9a84c]/5"
                    : "border-[#222] bg-[#111] hover:border-[#333]"
                }`}
              >
                <p className={`text-[13px] font-medium ${goal === g.value ? "text-[#c9a84c]" : "text-white"}`}>{g.label}</p>
                <p className="text-[11px] text-[#555] mt-0.5">{g.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Slides */}
        <div>
          <label className="text-[12px] text-[#555] font-medium uppercase tracking-wider mb-2 block">Slides</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSlideCount(null)}
              className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${
                slideCount === null
                  ? "bg-white text-black"
                  : "bg-[#111] border border-[#222] text-[#555] hover:text-white hover:border-[#333]"
              }`}
            >
              Auto
            </button>
            {[5, 7, 10, 12, 15].map((n) => (
              <button
                key={n}
                onClick={() => setSlideCount(n)}
                className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${
                  slideCount === n
                    ? "bg-white text-black"
                    : "bg-[#111] border border-[#222] text-[#555] hover:text-white hover:border-[#333]"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Additional instructions */}
        <div>
          <label className="text-[12px] text-[#555] font-medium uppercase tracking-wider mb-2 block">
            Instructions <span className="text-[#333] font-normal ml-1">(optional)</span>
          </label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="e.g. Use a provocative hook, include stats, end with a strong CTA..."
            rows={2}
            className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-[#333] focus:border-[#c9a84c] focus:outline-none transition-colors resize-none"
          />
        </div>

        {/* Generate */}
        <button
          onClick={handleGenerate}
          disabled={!topic.trim() || !selectedClientId || generate.isPending}
          className="w-full flex items-center justify-center gap-2 bg-[#c9a84c] text-black font-semibold px-6 py-3.5 rounded-xl text-[15px] hover:bg-[#d4b55a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {generate.isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
          ) : (
            <><Send className="h-4 w-4" /> Generate Carousel</>
          )}
        </button>

        {generate.isError && (
          <div className="rounded-xl border border-[#e84057]/20 bg-[#e84057]/5 p-3 text-[13px] text-[#e84057] text-center">
            Generation failed. Please try again.
          </div>
        )}
      </div>
    </div>
  );
}
