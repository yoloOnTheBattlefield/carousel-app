import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@quddify/ui/select";
import { Sparkles, Check, ChevronDown, ChevronUp, Loader2, Minus, Plus, Brain, RectangleVertical, Square, Zap, X, ArrowLeft, ArrowRight } from "lucide-react";
import { useClient } from "@/hooks/useClients";
import { useTranscripts } from "@/hooks/useTranscripts";
import { useSwipeFiles } from "@/hooks/useSwipeFiles";
import { useTemplates } from "@/hooks/useTemplates";
import { useGenerateCarousel, useCarouselJob } from "@/hooks/useCarousels";
import { useCarouselStyles } from "@/hooks/useCarouselStyles";
import { useLearningProfile } from "@/hooks/usePostInsights";
import { LutUpload } from "@/components/carousel/LutUpload";
import { LayoutPresetPicker } from "@/components/carousel/LayoutPresetPicker";
import { GenerationWizard, type WizardStep } from "@/components/carousel/GenerationWizard";
import { BUILT_IN_PRESETS, EMPTY_CONTENT_BRIEF, type ContentBrief, type BuiltInPreset } from "@/lib/style-presets";
import type { CarouselGoal, ContentType, ClientLut, LayoutPreset } from "@/types";

const WIZARD_STEPS: WizardStep[] = [
  { id: "content", label: "Content", description: "Select transcripts" },
  { id: "style", label: "Style", description: "Choose goal & style" },
  { id: "configure", label: "Configure", description: "Layout & options" },
  { id: "review", label: "Review", description: "Review & generate" },
];

const goals: Array<{ value: CarouselGoal; emoji: string; label: string; description: string }> = [
  { value: "saveable_educational", emoji: "\uD83D\uDCDA", label: "Educational", description: "Optimized for saves and shares" },
  { value: "polarizing_authority", emoji: "\uD83C\uDFAF", label: "Authority", description: "Bold takes that spark engagement" },
  { value: "emotional_story", emoji: "\uD83C\uDFAC", label: "Story", description: "Story-driven emotional connection" },
  { value: "conversion_focused", emoji: "\uD83D\uDE80", label: "Conversion", description: "Optimized for DMs and conversions" },
];

export default function GenerateCarousel({ defaultContentType = "carousel" as ContentType }: { defaultContentType?: ContentType } = {}) {
  const { id: clientId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: client } = useClient(clientId);
  const { data: transcripts = [] } = useTranscripts(clientId);
  const { data: swipeFiles = [] } = useSwipeFiles(clientId);
  useTemplates(clientId);
  const { data: carouselStyles = [] } = useCarouselStyles();
  const generateCarousel = useGenerateCarousel();
  const { data: learningProfile } = useLearningProfile(clientId);

  const [contentType, setContentType] = useState<ContentType>(defaultContentType);
  const [selectedTranscripts, setSelectedTranscripts] = useState<string[]>([]);
  const [useLearnings, setUseLearnings] = useState(true);
  const [selectedSwipeFile, setSelectedSwipeFile] = useState<string | null>(null);
  const [selectedTemplate] = useState<string | null>(null);
  const [selectedLut, setSelectedLut] = useState<ClientLut | null>(null);
  const [goal, setGoal] = useState<CarouselGoal>("saveable_educational");
  const [copyModel, setCopyModel] = useState<"claude-sonnet" | "claude-opus" | "gpt-4o">("claude-sonnet");
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
  const [selectedBuiltInPreset, setSelectedBuiltInPreset] = useState<BuiltInPreset | null>(null);
  const [contentBrief, setContentBrief] = useState<ContentBrief>({ ...EMPTY_CONTENT_BRIEF });
  const [showContentBrief, setShowContentBrief] = useState(false);
  const [stylePromptOverride, setStylePromptOverride] = useState("");
  const [showStyleOverride, setShowStyleOverride] = useState(false);
  const [layoutPreset, setLayoutPreset] = useState<LayoutPreset>({ mode: "ai_suggested" });
  const [generatingCarouselId, setGeneratingCarouselId] = useState<string | null>(null);
  const [slideCount, setSlideCount] = useState(5);
  const [includeCaption, setIncludeCaption] = useState(true);
  const [wizardStep, setWizardStep] = useState(0);

  const { data: job } = useCarouselJob(generatingCarouselId ?? undefined);

  const canAdvance = wizardStep === 0 ? selectedTranscripts.length > 0 : true;

  function nextStep() {
    if (wizardStep < WIZARD_STEPS.length - 1 && canAdvance) {
      setWizardStep(wizardStep + 1);
    }
  }

  function prevStep() {
    if (wizardStep > 0) {
      setWizardStep(wizardStep - 1);
    }
  }

  function toggleTranscript(id: string) {
    setSelectedTranscripts((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  function buildFinalStylePrompt(): string | null {
    if (selectedBuiltInPreset) {
      const brand = {
        name: client?.name || "Brand",
        handle: client?.ig_username ? `@${client.ig_username}` : "@handle",
        primaryColor: client?.brand_kit?.primary_color || "#C8102E",
      };
      return selectedBuiltInPreset.buildPrompt(contentBrief, brand);
    }
    return stylePromptOverride || null;
  }

  function handleGenerate() {
    if (!clientId || selectedTranscripts.length === 0) return;
    generateCarousel.mutate(
      {
        client_id: clientId,
        content_type: contentType,
        transcript_ids: selectedTranscripts,
        swipe_file_id: selectedSwipeFile,
        template_id: selectedTemplate,
        lut_id: selectedLut?._id ?? null,
        goal,
        copy_model: copyModel,
        style_id: selectedBuiltInPreset ? null : selectedStyleId,
        style_prompt_override: buildFinalStylePrompt(),
        layout_preset: layoutPreset.mode !== "ai_suggested" ? layoutPreset : undefined,
        include_caption: includeCaption,
        use_learning_profile: hasLearningProfile && useLearnings ? true : undefined,
      },
      {
        onSuccess: (data) => {
          setGeneratingCarouselId(data.carousel._id);
        },
      },
    );
  }

  if (job?.status === "completed" && generatingCarouselId) {
    navigate(`/clients/${clientId}/carousels/${generatingCarouselId}`);
  }

  const readyTranscripts = transcripts.filter((t) => t.status === "ready" || t.status === "pending");
  const isGenerating = !!generatingCarouselId && job?.status !== "failed";
  const hasLearningProfile = learningProfile && learningProfile.posts_analyzed > 0;

  return (
    <div className="max-w-[600px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[26px] font-bold text-white tracking-tight">
          Generate {contentType === "story" ? "Story Sequence" : "Carousel"}
        </h1>
        {client && (
          <p className="text-[#555] text-[14px] mt-1">
            {client.name} — {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
        )}
      </div>

      {/* Wizard Progress */}
      {!isGenerating && (
        <GenerationWizard
          steps={WIZARD_STEPS}
          currentStep={wizardStep}
          onStepClick={setWizardStep}
        />
      )}

      {isGenerating ? (
        <div className="bg-[#111] border border-[#222] rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-[#c9a84c]/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-5 w-5 text-[#c9a84c] animate-pulse" />
          </div>
          <h2 className="text-white text-[18px] font-bold mb-2">Generating...</h2>
          <p className="text-[#555] text-[14px] mb-5">{job?.current_step?.replace(/_/g, " ") || job?.status || "Queued"}</p>
          <div className="w-full bg-[#1a1a1a] rounded-full h-1.5 mb-2">
            <div
              className="bg-[#c9a84c] h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${job?.progress || 0}%` }}
            />
          </div>
          <p className="text-[#444] text-[12px]">{job?.progress || 0}%</p>
          {job?.status === "failed" && (
            <p className="mt-4 text-[13px] text-[#e84057]">{job.error || "Generation failed"}</p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Step 1: Content Selection */}
          {wizardStep === 0 && (<>
          {/* Content Format */}
          <div>
            <label className="text-[#555] text-[11px] font-semibold uppercase tracking-wider block mb-3">
              Format
            </label>
            <div className="flex gap-2">
              {([
                { value: "carousel" as const, label: "Carousel", hint: "1:1 / 4:5 slides", icon: Square },
                { value: "story" as const, label: "Story Sequence", hint: "9:16 vertical", icon: RectangleVertical },
              ]).map((fmt) => (
                <button
                  key={fmt.value}
                  type="button"
                  onClick={() => setContentType(fmt.value)}
                  className={`flex-1 px-4 py-3 rounded-xl text-[13px] font-medium transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    contentType === fmt.value
                      ? "border-[#c9a84c] bg-[#c9a84c]/5 border"
                      : "bg-[#0a0a0a] border border-[#222] text-[#888] hover:text-white hover:border-[#333]"
                  }`}
                >
                  <fmt.icon className={`h-5 w-5 ${contentType === fmt.value ? "text-[#c9a84c]" : ""}`} />
                  <span className={contentType === fmt.value ? "text-white" : ""}>{fmt.label}</span>
                  <span className={`text-[10px] font-normal ${contentType === fmt.value ? "text-[#c9a84c]/70" : "text-[#555]"}`}>{fmt.hint}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Select Transcripts */}
          <div>
            <label className="text-[#555] text-[11px] font-semibold uppercase tracking-wider block mb-3">
              Select Transcripts
            </label>
            {readyTranscripts.length === 0 ? (
              <p className="text-[#444] text-[13px]">No transcripts available. Add one first.</p>
            ) : (
              <div className="space-y-2">
                {readyTranscripts.map((t) => (
                  <button
                    key={t._id}
                    type="button"
                    onClick={() => toggleTranscript(t._id)}
                    className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                      selectedTranscripts.includes(t._id)
                        ? "border-[#c9a84c] bg-[#c9a84c]/5"
                        : "border-[#222] bg-[#0a0a0a] hover:border-[#333]"
                    }`}
                  >
                    <div>
                      <p className="text-white text-[14px] font-medium">{t.title}</p>
                      <p className="text-[#555] text-[12px] mt-0.5">
                        {t.call_type.replace(/_/g, " ")} {t.overall_strength > 0 ? `| Strength: ${t.overall_strength}` : ""}
                      </p>
                    </div>
                    {selectedTranscripts.includes(t._id) && (
                      <div className="w-5 h-5 rounded-full bg-[#c9a84c] flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3 text-black" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          </>)}

          {/* Step 2: Style & Goal */}
          {wizardStep === 1 && (<>
          {/* Carousel Goal */}
          <div>
            <label className="text-[#555] text-[11px] font-semibold uppercase tracking-wider block mb-3">
              Content Style
            </label>
            <div className="grid grid-cols-2 gap-3">
              {goals.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setGoal(g.value)}
                  className={`p-4 rounded-xl border text-center transition-all cursor-pointer ${
                    goal === g.value
                      ? "border-[#c9a84c] bg-[#c9a84c]/5"
                      : "border-[#222] bg-[#0a0a0a] hover:border-[#333]"
                  }`}
                >
                  <span className="text-2xl block mb-1">{g.emoji}</span>
                  <span className="text-white text-[13px] font-medium block">{g.label}</span>
                  <span className="text-[#555] text-[11px]">{g.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Slide Count */}
          <div>
            <label className="text-[#555] text-[11px] font-semibold uppercase tracking-wider block mb-3">
              Slide Count
            </label>
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center justify-center gap-6">
                <button
                  onClick={() => setSlideCount(Math.max(3, slideCount - 1))}
                  className="w-10 h-10 rounded-xl border border-[#222] bg-[#0a0a0a] flex items-center justify-center text-[#666] hover:border-[#333] hover:text-white transition-all cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-white text-[28px] font-bold w-12 text-center tabular-nums">
                  {slideCount}
                </span>
                <button
                  onClick={() => setSlideCount(Math.min(20, slideCount + 1))}
                  className="w-10 h-10 rounded-xl border border-[#222] bg-[#0a0a0a] flex items-center justify-center text-[#666] hover:border-[#333] hover:text-white transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <span className="text-[#444] text-[11px]">3–20 slides</span>
            </div>
          </div>

          </>)}

          {/* Step 3: Configure */}
          {wizardStep === 2 && (<>
          {/* Copy AI Model */}
          <div>
            <label className="text-[#555] text-[11px] font-semibold uppercase tracking-wider block mb-3">
              Copy AI Model
            </label>
            <div className="flex gap-2">
              {([
                { value: "claude-sonnet", label: "Sonnet", hint: "Fast & great quality" },
                { value: "claude-opus", label: "Opus", hint: "Best quality, slower" },
                { value: "gpt-4o", label: "GPT-4o", hint: "Alternative style" },
              ] as const).map((model) => (
                <button
                  key={model.value}
                  type="button"
                  onClick={() => setCopyModel(model.value)}
                  className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                    copyModel === model.value
                      ? "bg-white text-black"
                      : "bg-[#111] border border-[#222] text-[#888] hover:text-white hover:border-[#333]"
                  }`}
                >
                  <span>{model.label}</span>
                  <span className={`text-[10px] font-normal ${copyModel === model.value ? "text-black/60" : "text-[#555]"}`}>{model.hint}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Carousel Style */}
          <div>
            <label className="text-[#555] text-[11px] font-semibold uppercase tracking-wider block mb-3">
              Style Preset (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedStyleId(null);
                  setSelectedBuiltInPreset(null);
                  setShowContentBrief(false);
                }}
                className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${
                  !selectedStyleId && !selectedBuiltInPreset
                    ? "bg-white text-black"
                    : "bg-[#111] border border-[#222] text-[#888] hover:text-white hover:border-[#333]"
                }`}
              >
                Default
              </button>
              {BUILT_IN_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    const isActive = selectedBuiltInPreset?.id === preset.id;
                    setSelectedBuiltInPreset(isActive ? null : preset);
                    setSelectedStyleId(null);
                    setStylePromptOverride("");
                    if (!isActive) {
                      setSlideCount(preset.slideCount);
                      setShowContentBrief(true);
                    } else {
                      setShowContentBrief(false);
                    }
                  }}
                  className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedBuiltInPreset?.id === preset.id
                      ? "bg-[#c9a84c] text-black"
                      : "bg-[#111] border border-[#c9a84c]/30 text-[#c9a84c] hover:bg-[#c9a84c]/10 hover:border-[#c9a84c]/50"
                  }`}
                >
                  <Zap className="h-3 w-3" />
                  {preset.name}
                </button>
              ))}
              {carouselStyles.map((style) => (
                <button
                  key={style._id}
                  type="button"
                  onClick={() => {
                    setSelectedStyleId(selectedStyleId === style._id ? null : style._id);
                    setSelectedBuiltInPreset(null);
                    setShowContentBrief(false);
                    setStylePromptOverride("");
                  }}
                  className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${
                    selectedStyleId === style._id
                      ? "bg-white text-black"
                      : "bg-[#111] border border-[#222] text-[#888] hover:text-white hover:border-[#333]"
                  }`}
                >
                  {style.name}
                </button>
              ))}
            </div>

            {/* Built-in preset description */}
            {selectedBuiltInPreset && (
              <p className="text-[#c9a84c]/70 text-[11px] mt-2">{selectedBuiltInPreset.description}</p>
            )}

            {/* Content Brief (shown when a built-in preset with brief is selected) */}
            {selectedBuiltInPreset?.hasContentBrief && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setShowContentBrief(!showContentBrief)}
                  className="flex items-center gap-1.5 text-[12px] text-[#c9a84c] hover:text-[#d4b55a] transition-colors cursor-pointer"
                >
                  {showContentBrief ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {showContentBrief ? "Hide content brief" : "Fill content brief (recommended)"}
                </button>

                {showContentBrief && (
                  <div className="mt-3 space-y-3">
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4 space-y-4">
                      {/* Auto-filled brand info */}
                      {client && (
                        <div className="flex flex-wrap gap-2 text-[11px]">
                          <span className="px-2 py-0.5 rounded bg-[#111] border border-[#222] text-[#666]">
                            {client.name}
                          </span>
                          {client.ig_username && (
                            <span className="px-2 py-0.5 rounded bg-[#111] border border-[#222] text-[#666]">
                              @{client.ig_username}
                            </span>
                          )}
                          {client.brand_kit?.primary_color && (
                            <span className="px-2 py-0.5 rounded bg-[#111] border border-[#222] text-[#666] flex items-center gap-1">
                              <span
                                className="w-2.5 h-2.5 rounded-full inline-block"
                                style={{ backgroundColor: client.brand_kit.primary_color }}
                              />
                              {client.brand_kit.primary_color}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Topic */}
                      <div>
                        <label className="text-[#555] text-[10px] font-semibold uppercase tracking-wider block mb-1.5">
                          Topic / Offer
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 1-on-1 coaching program, online course, etc."
                          value={contentBrief.topic}
                          onChange={(e) => setContentBrief((b) => ({ ...b, topic: e.target.value }))}
                          className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-white text-[13px] placeholder:text-[#333] focus:outline-none focus:border-[#c9a84c]/40 transition-colors"
                        />
                      </div>

                      {/* Hook */}
                      <div>
                        <label className="text-[#555] text-[10px] font-semibold uppercase tracking-wider block mb-1.5">
                          Slide 1 — Hook
                        </label>
                        <input
                          type="text"
                          placeholder="What outcome does your audience want?"
                          value={contentBrief.hook}
                          onChange={(e) => setContentBrief((b) => ({ ...b, hook: e.target.value }))}
                          className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-white text-[13px] placeholder:text-[#333] focus:outline-none focus:border-[#c9a84c]/40 transition-colors"
                        />
                      </div>

                      {/* Problem */}
                      <div>
                        <label className="text-[#555] text-[10px] font-semibold uppercase tracking-wider block mb-1.5">
                          Slide 2 — Problem
                        </label>
                        <input
                          type="text"
                          placeholder="What are they doing wrong?"
                          value={contentBrief.problem}
                          onChange={(e) => setContentBrief((b) => ({ ...b, problem: e.target.value }))}
                          className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-white text-[13px] placeholder:text-[#333] focus:outline-none focus:border-[#c9a84c]/40 transition-colors"
                        />
                      </div>

                      {/* Core Insight */}
                      <div>
                        <label className="text-[#555] text-[10px] font-semibold uppercase tracking-wider block mb-1.5">
                          Slide 3 — Core Insight / Quote
                        </label>
                        <input
                          type="text"
                          placeholder="The key insight or memorable quote"
                          value={contentBrief.core_insight}
                          onChange={(e) => setContentBrief((b) => ({ ...b, core_insight: e.target.value }))}
                          className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-white text-[13px] placeholder:text-[#333] focus:outline-none focus:border-[#c9a84c]/40 transition-colors"
                        />
                      </div>

                      {/* The Shift */}
                      <div>
                        <label className="text-[#555] text-[10px] font-semibold uppercase tracking-wider block mb-1.5">
                          Slide 4 — The Shift
                        </label>
                        <input
                          type="text"
                          placeholder="What's the reframe? e.g. '20% vs 80%'"
                          value={contentBrief.the_shift}
                          onChange={(e) => setContentBrief((b) => ({ ...b, the_shift: e.target.value }))}
                          className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-white text-[13px] placeholder:text-[#333] focus:outline-none focus:border-[#c9a84c]/40 transition-colors"
                        />
                      </div>

                      {/* Proof Points */}
                      <div>
                        <label className="text-[#555] text-[10px] font-semibold uppercase tracking-wider block mb-1.5">
                          Slide 5 — Proof Points
                        </label>
                        <div className="space-y-1.5">
                          {contentBrief.proof_points.map((pp, i) => (
                            <input
                              key={i}
                              type="text"
                              placeholder={
                                i === 0
                                  ? 'e.g. "2x UFC World Title corners"'
                                  : i === 1
                                    ? 'e.g. "18+ Years coaching"'
                                    : `Proof point ${i + 1} (optional)`
                              }
                              value={pp}
                              onChange={(e) => {
                                const updated = [...contentBrief.proof_points];
                                updated[i] = e.target.value;
                                setContentBrief((b) => ({ ...b, proof_points: updated }));
                              }}
                              className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-white text-[13px] placeholder:text-[#333] focus:outline-none focus:border-[#c9a84c]/40 transition-colors"
                            />
                          ))}
                        </div>
                      </div>

                      {/* Solution Items */}
                      <div>
                        <label className="text-[#555] text-[10px] font-semibold uppercase tracking-wider block mb-1.5">
                          Slide 6 — Solution (3 items inside your offer)
                        </label>
                        <div className="space-y-1.5">
                          {contentBrief.solution_items.map((si, i) => (
                            <input
                              key={i}
                              type="text"
                              placeholder={
                                i === 0
                                  ? 'e.g. "Core technique library"'
                                  : i === 1
                                    ? 'e.g. "Direct access to me. Real coaching."'
                                    : 'e.g. "Weekly live sessions"'
                              }
                              value={si}
                              onChange={(e) => {
                                const updated = [...contentBrief.solution_items];
                                updated[i] = e.target.value;
                                setContentBrief((b) => ({ ...b, solution_items: updated }));
                              }}
                              className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-white text-[13px] placeholder:text-[#333] focus:outline-none focus:border-[#c9a84c]/40 transition-colors"
                            />
                          ))}
                        </div>
                      </div>

                      {/* CTA */}
                      <div>
                        <label className="text-[#555] text-[10px] font-semibold uppercase tracking-wider block mb-1.5">
                          Slide 7 — CTA
                        </label>
                        <input
                          type="text"
                          placeholder='What do you want them to do? e.g. "DM me READY"'
                          value={contentBrief.cta}
                          onChange={(e) => setContentBrief((b) => ({ ...b, cta: e.target.value }))}
                          className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-white text-[13px] placeholder:text-[#333] focus:outline-none focus:border-[#c9a84c]/40 transition-colors"
                        />
                      </div>
                    </div>

                    <p className="text-[#444] text-[10px]">
                      All fields are optional — the AI will fill gaps from your transcripts and brand kit.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Custom style prompt (only when no built-in preset) */}
            {!selectedBuiltInPreset && (
              <>
                <button
                  type="button"
                  onClick={() => setShowStyleOverride(!showStyleOverride)}
                  className="flex items-center gap-1.5 text-[12px] text-[#555] hover:text-[#888] transition-colors mt-3 cursor-pointer"
                >
                  {showStyleOverride ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {showStyleOverride ? "Hide custom prompt" : "Custom style prompt"}
                </button>
                {showStyleOverride && (
                  <textarea
                    placeholder="Paste your carousel style description here..."
                    value={stylePromptOverride}
                    onChange={(e) => setStylePromptOverride(e.target.value)}
                    rows={5}
                    className="w-full mt-3 bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 text-white text-[13px] placeholder:text-[#444] focus:outline-none focus:border-[#c9a84c]/50 transition-colors resize-none"
                  />
                )}
              </>
            )}
          </div>

          {/* Slide Layout */}
          <div>
            <label className="text-[#555] text-[11px] font-semibold uppercase tracking-wider block mb-3">
              Slide Layout
            </label>
            <div className="bg-[#0a0a0a] border border-[#222] rounded-xl p-4">
              <LayoutPresetPicker value={layoutPreset} onChange={setLayoutPreset} />
            </div>
          </div>

          {/* Reference Style */}
          {swipeFiles.length > 0 && (
            <div>
              <label className="text-[#555] text-[11px] font-semibold uppercase tracking-wider block mb-3">
                Reference Style (optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {swipeFiles.filter((sf) => sf.status === "ready").map((sf) => (
                  <button
                    key={sf._id}
                    type="button"
                    onClick={() => setSelectedSwipeFile(selectedSwipeFile === sf._id ? null : sf._id)}
                    className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${
                      selectedSwipeFile === sf._id
                        ? "border-[#c9a84c] bg-[#c9a84c]/5 border"
                        : "bg-[#111] border border-[#222] text-[#888] hover:text-white hover:border-[#333]"
                    }`}
                  >
                    {sf.title}
                    {sf.style_profile.style_name && (
                      <span className="ml-2 text-[10px] text-[#555]">{sf.style_profile.style_name}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Post Insights */}
          {hasLearningProfile && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center flex-shrink-0">
                  <Brain className="h-4 w-4 text-[#c9a84c]" />
                </div>
                <div>
                  <label className="text-[#555] text-[11px] font-semibold uppercase tracking-wider block">
                    Post Insights
                  </label>
                  <p className="text-[#444] text-[11px] mt-0.5">
                    Use learnings from {learningProfile.posts_analyzed} analyzed post{learningProfile.posts_analyzed !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUseLearnings(!useLearnings)}
                className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                  useLearnings ? "bg-[#c9a84c]" : "bg-[#222]"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    useLearnings ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          )}
          {hasLearningProfile && useLearnings && learningProfile.generation_prompt_summary && (
            <div className="bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 -mt-3">
              <p className="text-[#666] text-[11px] leading-relaxed">{learningProfile.generation_prompt_summary}</p>
            </div>
          )}

          {/* Color LUT */}
          {clientId && (
            <div>
              <label className="text-[#555] text-[11px] font-semibold uppercase tracking-wider block mb-3">
                Color LUT (optional)
              </label>
              <div className="bg-[#0a0a0a] border border-[#222] rounded-xl p-4">
                <LutUpload
                  clientId={clientId}
                  selectedLutId={selectedLut?._id}
                  onSelect={setSelectedLut}
                  compact
                />
              </div>
            </div>
          )}

          {/* Include Caption */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-[#555] text-[11px] font-semibold uppercase tracking-wider block">
                Include Caption
              </label>
              <p className="text-[#444] text-[11px] mt-0.5">Generate a post caption with the carousel</p>
            </div>
            <button
              type="button"
              onClick={() => setIncludeCaption(!includeCaption)}
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                includeCaption ? "bg-[#c9a84c]" : "bg-[#222]"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  includeCaption ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          </>)}

          {/* Step 4: Review & Generate */}
          {wizardStep === 3 && (<>
          <div className="bg-[#111] border border-[#222] rounded-2xl p-5 space-y-4">
            <h3 className="text-white text-[15px] font-semibold">Review Configuration</h3>
            <div className="space-y-2.5 text-[13px]">
              <div className="flex justify-between">
                <span className="text-[#555]">Format</span>
                <span className="text-white capitalize">{contentType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#555]">Transcripts</span>
                <span className="text-white">{selectedTranscripts.length} selected</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#555]">Goal</span>
                <span className="text-white capitalize">{goal.replace(/_/g, " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#555]">Slides</span>
                <span className="text-white">{slideCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#555]">AI Model</span>
                <span className="text-white">{copyModel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#555]">Style</span>
                <span className="text-white">{selectedBuiltInPreset?.name || (selectedStyleId ? "Custom" : "Default")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#555]">Layout</span>
                <span className="text-white capitalize">{layoutPreset.mode.replace(/_/g, " ")}</span>
              </div>
              {selectedLut && (
                <div className="flex justify-between">
                  <span className="text-[#555]">Color LUT</span>
                  <span className="text-white">{selectedLut.name}</span>
                </div>
              )}
              {selectedSwipeFile && (
                <div className="flex justify-between">
                  <span className="text-[#555]">Reference</span>
                  <span className="text-white">{swipeFiles.find((sf) => sf._id === selectedSwipeFile)?.title || "Selected"}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#555]">Caption</span>
                <span className="text-white">{includeCaption ? "Yes" : "No"}</span>
              </div>
              {hasLearningProfile && (
                <div className="flex justify-between">
                  <span className="text-[#555]">Post Insights</span>
                  <span className="text-white">{useLearnings ? "Enabled" : "Disabled"}</span>
                </div>
              )}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={selectedTranscripts.length === 0 || generateCarousel.isPending}
            className="w-full bg-[#c9a84c] text-black font-bold py-3.5 rounded-xl text-[15px] hover:bg-[#d4b55a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="h-4.5 w-4.5" />
            {generateCarousel.isPending ? "Starting..." : `Generate ${contentType === "story" ? "Story Sequence" : "Carousel"}`}
          </button>
          </>)}

          {/* Wizard Navigation */}
          {wizardStep < 3 && (
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={prevStep}
                disabled={wizardStep === 0}
                className="flex items-center gap-1.5 text-[13px] text-[#555] hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
              <button
                type="button"
                onClick={nextStep}
                disabled={!canAdvance}
                className="flex items-center gap-1.5 bg-white text-black font-semibold px-5 py-2.5 rounded-xl text-[13px] hover:bg-[#e0e0e0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Next <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          {wizardStep === 3 && (
            <div className="flex items-center justify-start pt-2">
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center gap-1.5 text-[13px] text-[#555] hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Configure
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
