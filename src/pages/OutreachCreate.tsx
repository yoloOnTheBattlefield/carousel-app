import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Send,
  Instagram,
  Check,
  AlertCircle,
  Timer,
  Pencil,
} from "lucide-react";
import { useSelectedClient } from "@/contexts/ClientContext";
import {
  useScrapeProspect,
  useProspectProfile,
  useProspectProfiles,
  useProspectImages,
  useUpdateProspectProfile,
  useGenerateOutreachCarousel,
  useCancelScrape,
} from "@/hooks/useOutreach";
import type { CarouselGoal, CTAMechanism, ProspectProfile as ProspectProfileType } from "@/types";

const GOALS: Array<{ value: CarouselGoal; label: string; desc: string }> = [
  { value: "conversion_focused", label: "Conversion", desc: "Drive DMs — agitate, solve, CTA" },
  { value: "saveable_educational", label: "Educational", desc: "Maximize saves — real value" },
  { value: "polarizing_authority", label: "Authority", desc: "Bold takes that spark debate" },
  { value: "emotional_story", label: "Story", desc: "Emotional connection" },
];

const CTA_OPTIONS: Array<{ value: CTAMechanism; label: string }> = [
  { value: "comment_keyword", label: "Comment a keyword" },
  { value: "link_in_bio", label: "Link in bio" },
  { value: "dm_trigger", label: "DM trigger" },
  { value: "custom", label: "Custom" },
];

const SCRAPE_STEPS = [
  { key: "profile", label: "Fetching profile" },
  { key: "posts", label: "Scraping posts" },
  { key: "images", label: "Downloading images" },
  { key: "reels", label: "Scraping reels" },
  { key: "transcribing", label: "Transcribing top reels" },
  { key: "profiling", label: "Generating profile" },
];

type Step = "input" | "profile" | "configure" | "generating";

export default function OutreachCreate() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedClientId, selectedClient } = useSelectedClient();

  // profileId is always derived from URL — single source of truth
  const profileId = searchParams.get("profile") || undefined;
  const [step, setStep] = useState<Step>(profileId ? "profile" : "input");
  const [handle, setHandle] = useState("");
  const [urlsText, setUrlsText] = useState("");
  const [goal, setGoal] = useState<CarouselGoal>("conversion_focused");
  const [slideCount, setSlideCount] = useState(7);
  const [instructions, setInstructions] = useState("");
  const [editingField, setEditingField] = useState<string | null>(null);

  // Queries
  const profile = useProspectProfile(profileId);
  const images = useProspectImages(profileId);
  const recentProfiles = useProspectProfiles();

  // Mutations
  const scrape = useScrapeProspect();
  const updateProfile = useUpdateProspectProfile(profileId);
  const generate = useGenerateOutreachCarousel(profileId);
  const cancelScrape = useCancelScrape(profileId);

  // Derived
  const profileData = profile.data?.profile;
  const isReady = profile.data?.status === "ready";
  const isScraping = profile.data?.status === "scraping" || profile.data?.status === "profiling";
  const isFailed = profile.data?.status === "failed";

  // ─── Handlers ─────────────────────────────────────────────────────────

  async function handleScrape() {
    if (!selectedClientId || !handle.trim()) return;

    // Check if this handle was already scraped
    const normalizedHandle = handle.trim().replace(/^@/, "").toLowerCase();
    const existing = recentProfiles.data?.find(
      (p) => p.ig_handle.toLowerCase() === normalizedHandle && p.status !== "failed",
    );
    if (existing) {
      const confirmed = window.confirm(
        `You already scraped @${existing.ig_handle}${existing.status === "ready" ? " (ready)" : " (in progress)"}. Scrape again?`,
      );
      if (!confirmed) {
        // Load the existing one instead
        setSearchParams({ profile: existing._id }, { replace: true });
        if (existing.status === "ready") setStep("profile");
        return;
      }
    }

    // Parse URLs if provided
    const directUrls = urlsText
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter((u) => u.startsWith("http"));

    const result = await scrape.mutateAsync({
      ig_handle: handle.trim(),
      client_id: selectedClientId,
      ...(directUrls.length > 0 ? { direct_urls: directUrls } : {}),
    });
    setSearchParams({ profile: result.profile_id }, { replace: true });
  }

  async function handleGenerate() {
    if (!profileId || !isReady) return;
    const topic = profileData?.top_performing_angles?.[0]?.angle || profileData?.core_message || `Content for @${profile.data?.ig_handle}`;
    const result = await generate.mutateAsync({
      topic,
      goal,
      slide_count: slideCount,
      additional_instructions: instructions.trim() || undefined,
    });
    navigate(`/carousels/${result.carousel._id}`);
  }

  function handleFieldSave(field: string, value: string | string[]) {
    if (!profileId) return;
    updateProfile.mutate({
      profile: { [field]: value },
    });
    setEditingField(null);
  }

  function handleCTAChange(mechanism: CTAMechanism, detected_cta?: string) {
    if (!profileId) return;
    updateProfile.mutate({
      profile: {
        cta_style: { mechanism, ...(detected_cta ? { detected_cta } : {}) },
      },
    });
  }

  function handleBrandColorChange(key: string, value: string) {
    if (!profileId) return;
    updateProfile.mutate({
      inferred_brand: { [key]: value },
    });
  }

  // Auto-advance when profile becomes ready
  useEffect(() => {
    if (isReady && step === "input") {
      setStep("profile");
    }
  }, [isReady, step]);

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => step === "input" ? navigate("/") : setStep(step === "configure" ? "profile" : "input")}
          className="flex items-center justify-center w-9 h-9 rounded-xl border border-[#222] text-[#555] hover:text-white hover:border-[#333] transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-[28px] font-bold text-white tracking-tight">Outreach Carousel</h1>
          <p className="text-[#555] text-[14px] mt-1">
            {profile.data?.ig_handle
              ? `Building for @${profile.data.ig_handle}`
              : "Create a carousel from any public Instagram profile"}
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 max-w-xl mx-auto">
        {(["input", "profile", "configure"] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold transition-all ${
                step === s
                  ? "bg-[#c9a84c] text-black"
                  : (["input", "profile", "configure"].indexOf(step) > i)
                  ? "bg-[#c9a84c]/20 text-[#c9a84c]"
                  : "bg-[#111] border border-[#222] text-[#555]"
              }`}
            >
              {(["input", "profile", "configure"].indexOf(step) > i) ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            {i < 2 && <div className={`h-px flex-1 ${(["input", "profile", "configure"].indexOf(step) > i) ? "bg-[#c9a84c]/30" : "bg-[#222]"}`} />}
          </div>
        ))}
      </div>

      <div className="max-w-xl mx-auto space-y-6">
        {/* ──────── Step 1: Input ──────── */}
        {step === "input" && (
          <>
            <div>
              <label className="text-[12px] text-[#555] font-medium uppercase tracking-wider mb-2 block">Instagram Handle</label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#555]" />
                  <input
                    value={handle}
                    onChange={(e) => setHandle(e.target.value.replace(/\s/g, ""))}
                    placeholder="@owen_roddy"
                    className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl pl-10 pr-4 py-3 text-[14px] text-white placeholder:text-[#333] focus:border-[#c9a84c] focus:outline-none transition-colors"
                    onKeyDown={(e) => e.key === "Enter" && handleScrape()}
                  />
                </div>
                <button
                  onClick={handleScrape}
                  disabled={!handle.trim() || !selectedClientId || scrape.isPending || isScraping}
                  className="px-6 py-3 bg-[#c9a84c] text-black font-semibold rounded-xl text-[14px] hover:bg-[#d4b55a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {scrape.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Scrape"}
                </button>
              </div>
            </div>

            {/* Direct URLs (optional) */}
            <div>
              <label className="text-[12px] text-[#555] font-medium uppercase tracking-wider mb-2 block">
                Post / Reel URLs <span className="text-[#333] font-normal ml-1">(optional — paste specific URLs to scrape)</span>
              </label>
              <textarea
                value={urlsText}
                onChange={(e) => setUrlsText(e.target.value)}
                placeholder={"https://www.instagram.com/p/ABC123/\nhttps://www.instagram.com/reel/XYZ789/"}
                rows={3}
                className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 text-[12px] text-white placeholder:text-[#333] focus:border-[#c9a84c] focus:outline-none transition-colors resize-none font-mono"
              />
              {urlsText.trim() && (
                <p className="text-[11px] text-[#555] mt-1">
                  {urlsText.split(/[\n,]+/).filter((u) => u.trim().startsWith("http")).length} URL(s) — will scrape these instead of auto-fetching posts
                </p>
              )}
            </div>

            {/* Scraping progress */}
            {isScraping && profile.data && (
              <div className="rounded-xl border border-[#222] bg-[#0a0a0a] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-[#c9a84c]" />
                    <p className="text-[13px] text-white font-medium">Scraping @{profile.data.ig_handle}...</p>
                  </div>
                  <button
                    onClick={() => cancelScrape.mutate()}
                    disabled={cancelScrape.isPending}
                    className="text-[12px] text-[#e84057] hover:text-[#ff5a6e] font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
                <div className="space-y-2">
                  {SCRAPE_STEPS.map((s) => {
                    const currentStep = profile.data?.current_step || "";
                    const currentStepIdx = SCRAPE_STEPS.findIndex((ss) => ss.key === currentStep);
                    const stepIdx = SCRAPE_STEPS.findIndex((ss) => ss.key === s.key);
                    const isDone = currentStepIdx >= 0 && stepIdx < currentStepIdx;
                    const isCurrent = stepIdx === currentStepIdx;
                    return (
                      <div key={s.key} className="flex items-center gap-2">
                        {isDone ? (
                          <Check className="h-3.5 w-3.5 text-green-500" />
                        ) : isCurrent ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#c9a84c]" />
                        ) : (
                          <div className="h-3.5 w-3.5 rounded-full border border-[#333]" />
                        )}
                        <span className={`text-[12px] ${isDone ? "text-[#555]" : isCurrent ? "text-white" : "text-[#333]"}`}>
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {isFailed && (
              <div className="rounded-xl border border-[#e84057]/20 bg-[#e84057]/5 p-3 text-[13px] text-[#e84057] flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {profile.data?.error || "Scraping failed. The account may be private."}
              </div>
            )}

            {/* Recent outreach jobs */}
            {recentProfiles.data && recentProfiles.data.length > 0 && (
              <div>
                <label className="text-[12px] text-[#555] font-medium uppercase tracking-wider mb-3 block">Recent</label>
                <div className="space-y-2">
                  {recentProfiles.data.map((p) => (
                    <RecentProfileRow
                      key={p._id}
                      profile={p}
                      onSelect={(id) => {
                        setSearchParams({ profile: id }, { replace: true });
                        if (p.status === "ready") setStep("profile");
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ──────── Step 2: Profile Review ──────── */}
        {step === "profile" && profileData && (
          <>
            {/* Profile header */}
            <div className="flex items-center gap-4 rounded-xl border border-[#222] bg-[#0a0a0a] p-4">
              {profile.data?.ig_profile_picture_url && (
                <img
                  src={profile.data.ig_profile_picture_url}
                  alt={profile.data.ig_handle}
                  className="w-14 h-14 rounded-full object-cover border border-[#222]"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-white">{profileData.name}</p>
                <p className="text-[13px] text-[#555]">@{profile.data?.ig_handle}</p>
                {profile.data?.ig_followers_count ? (
                  <p className="text-[12px] text-[#555] mt-0.5">{profile.data.ig_followers_count.toLocaleString()} followers</p>
                ) : null}
              </div>
              {profile.data?.generation_time_ms && (
                <div className="flex items-center gap-1.5 text-[12px] text-[#555] bg-[#111] rounded-lg px-2.5 py-1.5 border border-[#222]">
                  <Timer className="h-3.5 w-3.5" />
                  {Math.round(profile.data.generation_time_ms / 1000)}s
                </div>
              )}
            </div>

            {/* Editable fields */}
            {[
              { key: "niche", label: "Niche" },
              { key: "offer", label: "Offer / Product" },
              { key: "audience", label: "Audience" },
              { key: "core_message", label: "Core Message" },
              { key: "voice_notes", label: "Voice Notes", multiline: true },
            ].map((field) => (
              <div key={field.key} className="rounded-xl border border-[#222] bg-[#0a0a0a] p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] text-[#555] font-medium uppercase tracking-wider">{field.label}</label>
                  <button
                    onClick={() => setEditingField(editingField === field.key ? null : field.key)}
                    className="text-[#555] hover:text-[#c9a84c] transition-colors cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
                {editingField === field.key ? (
                  <div className="space-y-2">
                    {field.multiline ? (
                      <textarea
                        defaultValue={(profileData as Record<string, string>)[field.key] || ""}
                        rows={4}
                        className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-[13px] text-white focus:border-[#c9a84c] focus:outline-none resize-none"
                        onBlur={(e) => handleFieldSave(field.key, e.target.value)}
                      />
                    ) : (
                      <input
                        defaultValue={(profileData as Record<string, string>)[field.key] || ""}
                        className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-[13px] text-white focus:border-[#c9a84c] focus:outline-none"
                        onBlur={(e) => handleFieldSave(field.key, e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleFieldSave(field.key, (e.target as HTMLInputElement).value)}
                      />
                    )}
                  </div>
                ) : (
                  <p className="text-[13px] text-white leading-relaxed">
                    {(profileData as Record<string, string>)[field.key] || <span className="text-[#333]">Not detected</span>}
                  </p>
                )}
              </div>
            ))}

            {/* CTA Style */}
            <div className="rounded-xl border border-[#222] bg-[#0a0a0a] p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] text-[#555] font-medium uppercase tracking-wider">CTA Style</label>
                {profileData.cta_style?.confidence != null && (
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                    profileData.cta_style.confidence >= 0.7
                      ? "bg-green-500/10 text-green-400"
                      : profileData.cta_style.confidence >= 0.4
                      ? "bg-yellow-500/10 text-yellow-400"
                      : "bg-red-500/10 text-red-400"
                  }`}>
                    {Math.round(profileData.cta_style.confidence * 100)}% confident
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {CTA_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleCTAChange(opt.value)}
                    className={`rounded-lg border p-2 text-left transition-all cursor-pointer ${
                      profileData.cta_style?.mechanism === opt.value
                        ? "border-[#c9a84c] bg-[#c9a84c]/5"
                        : "border-[#222] hover:border-[#333]"
                    }`}
                  >
                    <p className={`text-[12px] font-medium ${
                      profileData.cta_style?.mechanism === opt.value ? "text-[#c9a84c]" : "text-white"
                    }`}>{opt.label}</p>
                  </button>
                ))}
              </div>
              <input
                defaultValue={profileData.cta_style?.detected_cta || ""}
                placeholder="e.g. DM me READY, Link in bio, Comment FIRE"
                className="w-full bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-[#333] focus:border-[#c9a84c] focus:outline-none"
                onBlur={(e) => handleCTAChange(profileData.cta_style?.mechanism || "custom", e.target.value)}
              />
            </div>

            {/* Brand Colors */}
            <div className="rounded-xl border border-[#222] bg-[#0a0a0a] p-4">
              <label className="text-[11px] text-[#555] font-medium uppercase tracking-wider mb-2 block">Inferred Brand</label>
              <div className="flex items-center gap-3">
                {(["primary_color", "secondary_color", "accent_color"] as const).map((key) => (
                  <div key={key} className="flex items-center gap-2">
                    <input
                      type="color"
                      value={profile.data?.inferred_brand?.[key] || "#000000"}
                      onChange={(e) => handleBrandColorChange(key, e.target.value)}
                      className="w-8 h-8 rounded-lg border border-[#333] cursor-pointer bg-transparent"
                    />
                    <span className="text-[11px] text-[#555]">{key.replace("_color", "").replace("_", " ")}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Content Angles */}
            {profileData.content_angles?.length > 0 && (
              <div className="rounded-xl border border-[#222] bg-[#0a0a0a] p-4">
                <label className="text-[11px] text-[#555] font-medium uppercase tracking-wider mb-2 block">Content Angles</label>
                <div className="flex flex-wrap gap-2">
                  {profileData.content_angles.map((angle, i) => (
                    <span key={i} className="text-[12px] text-white bg-[#111] border border-[#222] rounded-lg px-2.5 py-1">
                      {angle}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Photo Grid */}
            {images.data && images.data.length > 0 && (
              <div className="rounded-xl border border-[#222] bg-[#0a0a0a] p-4">
                <label className="text-[11px] text-[#555] font-medium uppercase tracking-wider mb-2 block">
                  Scraped Photos ({images.data.length})
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {images.data.slice(0, 15).map((img) => (
                    <div key={img._id} className="aspect-square rounded-lg overflow-hidden border border-[#222]">
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {images.data.length > 15 && (
                    <div className="aspect-square rounded-lg border border-[#222] flex items-center justify-center text-[12px] text-[#555]">
                      +{images.data.length - 15}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Next */}
            <button
              onClick={() => setStep("configure")}
              className="w-full flex items-center justify-center gap-2 bg-[#c9a84c] text-black font-semibold px-6 py-3.5 rounded-xl text-[15px] hover:bg-[#d4b55a] transition-colors cursor-pointer"
            >
              Configure Carousel <ArrowRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* ──────── Step 3: Configure ──────── */}
        {step === "configure" && (
          <>
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

            {/* Slide count */}
            <div>
              <label className="text-[12px] text-[#555] font-medium uppercase tracking-wider mb-2 block">Slides</label>
              <div className="flex items-center gap-3">
                {[5, 7, 9, 11].map((n) => (
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

            {/* Instructions */}
            <div>
              <label className="text-[12px] text-[#555] font-medium uppercase tracking-wider mb-2 block">
                Instructions <span className="text-[#333] font-normal ml-1">(optional)</span>
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Focus on their Fight IQ philosophy, reference specific fighters..."
                rows={2}
                className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-[#333] focus:border-[#c9a84c] focus:outline-none transition-colors resize-none"
              />
            </div>

            {/* Generate */}
            <button
              onClick={handleGenerate}
              disabled={generate.isPending}
              className="w-full flex items-center justify-center gap-2 bg-[#c9a84c] text-black font-semibold px-6 py-3.5 rounded-xl text-[15px] hover:bg-[#d4b55a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {generate.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
              ) : (
                <><Send className="h-4 w-4" /> Generate Outreach Carousel</>
              )}
            </button>

            {generate.isError && (
              <div className="rounded-xl border border-[#e84057]/20 bg-[#e84057]/5 p-3 text-[13px] text-[#e84057] text-center">
                Generation failed. Please try again.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const STATUS_STYLES: Record<string, { dot: string; label: string }> = {
  scraping: { dot: "bg-[#c9a84c] animate-pulse", label: "Scraping" },
  profiling: { dot: "bg-[#c9a84c] animate-pulse", label: "Profiling" },
  ready: { dot: "bg-emerald-500", label: "Ready" },
  failed: { dot: "bg-[#e84057]", label: "Failed" },
  expired: { dot: "bg-[#555]", label: "Expired" },
};

function RecentProfileRow({
  profile,
  onSelect,
}: {
  profile: ProspectProfileType;
  onSelect: (id: string) => void;
}) {
  const s = STATUS_STYLES[profile.status] || STATUS_STYLES.expired;
  const name = profile.profile?.name || profile.ig_handle;
  const niche = profile.profile?.niche;
  const timeAgo = getTimeAgo(profile.createdAt);

  return (
    <button
      onClick={() => onSelect(profile._id)}
      className="w-full flex items-center gap-3 rounded-xl border border-[#222] bg-[#0a0a0a] hover:border-[#333] p-3 text-left transition-all cursor-pointer group"
    >
      {profile.ig_profile_picture_url ? (
        <img
          src={profile.ig_profile_picture_url}
          alt={profile.ig_handle}
          className="w-10 h-10 rounded-full object-cover border border-[#222] shrink-0"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-[#111] border border-[#222] flex items-center justify-center shrink-0">
          <Instagram className="h-4 w-4 text-[#555]" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-medium text-white truncate">{name}</p>
          <div className="flex items-center gap-1.5 shrink-0">
            <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            <span className="text-[11px] text-[#555]">{s.label}</span>
          </div>
        </div>
        <p className="text-[11px] text-[#555] truncate">
          @{profile.ig_handle}
          {niche ? ` · ${niche}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {profile.generation_time_ms && (
          <span className="text-[11px] text-[#555] flex items-center gap-1">
            <Timer className="h-3 w-3" />
            {Math.round(profile.generation_time_ms / 1000)}s
          </span>
        )}
        <span className="text-[11px] text-[#444]">{timeAgo}</span>
        <ArrowRight className="h-3.5 w-3.5 text-[#333] group-hover:text-[#c9a84c] transition-colors" />
      </div>
    </button>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
