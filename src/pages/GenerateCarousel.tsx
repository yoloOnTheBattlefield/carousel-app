import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sparkles, Loader2 } from "lucide-react";
import { useClient } from "@/hooks/useClients";
import { useGenerateCarousel, useCarouselJob } from "@/hooks/useCarousels";
import { useLearningProfile } from "@/hooks/usePostInsights";
import { VibePicker } from "@/components/carousel/VibePicker";
import { TranscriptSelector } from "@/components/carousel/TranscriptSelector";
import { AdvancedOptions, DEFAULT_ADVANCED_OPTIONS, type AdvancedOptionsState } from "@/components/carousel/AdvancedOptions";
import { BUILT_IN_PRESETS, EMPTY_CONTENT_BRIEF } from "@/lib/style-presets";
import type { Vibe } from "@/lib/vibes";
import type { ContentType } from "@/types";

export default function GenerateCarousel({ defaultContentType = "carousel" as ContentType }: { defaultContentType?: ContentType } = {}) {
  const { id: clientId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: client } = useClient(clientId);
  const generateCarousel = useGenerateCarousel();
  const { data: learningProfile } = useLearningProfile(clientId);

  const [selectedVibe, setSelectedVibe] = useState<Vibe | null>(null);
  const [selectedTranscripts, setSelectedTranscripts] = useState<string[]>([]);
  const [topic, setTopic] = useState("");
  const [advanced, setAdvanced] = useState<AdvancedOptionsState>(DEFAULT_ADVANCED_OPTIONS);
  const [generatingCarouselId, setGeneratingCarouselId] = useState<string | null>(null);

  const { data: job } = useCarouselJob(generatingCarouselId ?? undefined);

  const hasLearningProfile = learningProfile && learningProfile.posts_analyzed > 0;
  const canGenerate = selectedTranscripts.length > 0 && selectedVibe !== null;
  const isGenerating = !!generatingCarouselId && job?.status !== "failed";

  // Navigate to result when generation completes
  useEffect(() => {
    if (job?.status === "completed" && generatingCarouselId) {
      navigate(`/clients/${clientId}/carousels/${generatingCarouselId}`);
    }
  }, [job?.status, generatingCarouselId, clientId, navigate]);

  function handleGenerate() {
    if (!clientId || !canGenerate || !selectedVibe) return;

    // Build style prompt from built-in preset if the vibe maps to one
    let stylePromptOverride: string | null = null;
    if (selectedVibe.builtInPresetId) {
      const preset = BUILT_IN_PRESETS.find((p) => p.id === selectedVibe.builtInPresetId);
      if (preset) {
        const brand = {
          name: client?.name || "Brand",
          handle: client?.ig_username ? `@${client.ig_username}` : "@handle",
          primaryColor: client?.brand_kit?.primary_color || "#C8102E",
        };
        // Use topic as the brief's topic field, AI fills the rest
        const brief = { ...EMPTY_CONTENT_BRIEF, topic: topic || client?.niche || "" };
        stylePromptOverride = preset.buildPrompt(brief, brand);
      }
    }

    generateCarousel.mutate(
      {
        client_id: clientId,
        content_type: defaultContentType,
        transcript_ids: selectedTranscripts,
        swipe_file_id: advanced.selectedSwipeFile,
        template_id: null,
        lut_id: advanced.selectedLut?._id ?? null,
        goal: selectedVibe.goal,
        copy_model: advanced.copyModel,
        style_id: null,
        style_prompt_override: stylePromptOverride,
        layout_preset: selectedVibe.layoutPreset.mode !== "ai_suggested" ? selectedVibe.layoutPreset : undefined,
        include_caption: advanced.includeCaption,
        use_learning_profile: hasLearningProfile && advanced.useLearnings ? true : undefined,
      },
      {
        onSuccess: (data) => {
          setGeneratingCarouselId(data.carousel._id);
        },
      },
    );
  }

  return (
    <div className="max-w-[600px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[26px] font-bold text-white tracking-tight">
          Generate {defaultContentType === "story" ? "Story Sequence" : "Carousel"}
        </h1>
        {client && (
          <p className="text-[#555] text-[14px] mt-1">
            {client.name} — {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
        )}
      </div>

      {isGenerating ? (
        /* Generation Progress */
        <div className="bg-[#111] border border-[#222] rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-[#c9a84c]/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-5 w-5 text-[#c9a84c] animate-pulse" />
          </div>
          <h2 className="text-white text-[18px] font-bold mb-2">Generating your carousel...</h2>
          <p className="text-[#555] text-[14px] mb-5">
            {job?.current_step?.replace(/_/g, " ") || job?.status || "Queued"}
          </p>
          <div className="w-full bg-[#1a1a1a] rounded-full h-1.5 mb-2">
            <div
              className="bg-[#c9a84c] h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${job?.progress || 0}%` }}
            />
          </div>
          <p className="text-[#444] text-[12px]">{job?.progress || 0}%</p>
          {job?.status === "failed" && (
            <div className="mt-4">
              <p className="text-[13px] text-[#e84057] mb-3">{job.error || "Generation failed"}</p>
              <button
                onClick={() => setGeneratingCarouselId(null)}
                className="text-[13px] text-[#c9a84c] hover:text-[#d4b55a] transition-colors cursor-pointer"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Generation Form */
        <div className="space-y-6">
          {/* 1. Vibe Picker */}
          <VibePicker selected={selectedVibe} onSelect={setSelectedVibe} />

          {/* 2. Source Content */}
          <TranscriptSelector
            clientId={clientId}
            selected={selectedTranscripts}
            onChange={setSelectedTranscripts}
          />

          {/* 3. Topic (optional) */}
          <div>
            <label className="text-[#555] text-[11px] font-semibold uppercase tracking-wider block mb-2">
              Topic <span className="text-[#333] font-normal normal-case">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 1-on-1 coaching program, new course launch, mindset shift..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 text-white text-[14px] placeholder:text-[#333] focus:outline-none focus:border-[#c9a84c]/40 transition-colors"
            />
          </div>

          {/* 4. Advanced Options */}
          {clientId && (
            <AdvancedOptions
              clientId={clientId}
              options={advanced}
              onChange={setAdvanced}
            />
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate || generateCarousel.isPending}
            className="w-full bg-[#c9a84c] text-black font-bold py-4 rounded-xl text-[15px] hover:bg-[#d4b55a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
          >
            {generateCarousel.isPending ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Sparkles className="h-4.5 w-4.5" />
                Generate Carousel
              </>
            )}
          </button>

          {!canGenerate && selectedTranscripts.length === 0 && selectedVibe && (
            <p className="text-[#444] text-[11px] text-center -mt-3">Select at least one transcript to continue</p>
          )}
          {!canGenerate && !selectedVibe && selectedTranscripts.length > 0 && (
            <p className="text-[#444] text-[11px] text-center -mt-3">Pick a vibe to continue</p>
          )}
        </div>
      )}
    </div>
  );
}
