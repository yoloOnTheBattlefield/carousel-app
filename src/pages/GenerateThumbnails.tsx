import { useState } from "react";
import { useParams } from "react-router-dom";
import { Sparkles, Check, Loader2, Download, RefreshCw, Plus, X, Link, Search, Palette, LayoutGrid } from "lucide-react";
import { useClient } from "@/hooks/useClients";
import { useImages } from "@/hooks/useImages";
import { useGenerateThumbnails, useThumbnailJob, useIterateThumbnail, useThumbnails, useThumbnailTemplates } from "@/hooks/useThumbnails";
import type { ThumbnailJob, ClientImage } from "@/types";

export default function GenerateThumbnails() {
  const { id: clientId } = useParams<{ id: string }>();
  const { data: client } = useClient(clientId);
  const { data: imageData } = useImages(clientId, { limit: "200" });
  const { data: history = [] } = useThumbnails(clientId);
  const { data: templates = [] } = useThumbnailTemplates();
  const generateThumbnails = useGenerateThumbnails();
  const iterateThumbnail = useIterateThumbnail();

  const [topic, setTopic] = useState("");
  const [selectedHeadshot, setSelectedHeadshot] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [referenceUrls, setReferenceUrls] = useState<string[]>([]);
  const [newRefUrl, setNewRefUrl] = useState("");
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);
  const [iterationFeedback, setIterationFeedback] = useState("");

  const { data: job } = useThumbnailJob(activeJobId ?? undefined);

  const images = imageData?.images ?? [];
  const headshotCandidates = images.filter(
    (img) => img.status === "ready" && img.face_visibility_score >= 40,
  );

  const isGenerating = !!activeJobId && job?.status !== "completed" && job?.status !== "failed";
  const isCompleted = job?.status === "completed";

  function addRefUrl() {
    const url = newRefUrl.trim();
    if (url && url.startsWith("http") && referenceUrls.length < 5) {
      setReferenceUrls([...referenceUrls, url]);
      setNewRefUrl("");
    }
  }

  function removeRefUrl(idx: number) {
    setReferenceUrls(referenceUrls.filter((_, i) => i !== idx));
  }

  function handleGenerate() {
    if (!clientId || !topic.trim() || !selectedHeadshot) return;
    generateThumbnails.mutate(
      {
        client_id: clientId,
        topic: topic.trim(),
        headshot_image_id: selectedHeadshot,
        template_id: selectedTemplate || undefined,
        reference_urls: referenceUrls.length > 0 ? referenceUrls : undefined,
      },
      {
        onSuccess: (data: ThumbnailJob) => {
          setActiveJobId(data._id);
        },
      },
    );
  }

  function handleIterate() {
    if (!activeJobId || !selectedConcept || !iterationFeedback.trim()) return;
    iterateThumbnail.mutate(
      { jobId: activeJobId, label: selectedConcept, feedback: iterationFeedback.trim() },
      { onSuccess: () => setIterationFeedback("") },
    );
  }

  function handleRegenerate() {
    if (!clientId || !job) return;
    generateThumbnails.mutate(
      {
        client_id: clientId,
        topic: job.topic,
        headshot_image_id: job.headshot_image_id,
        reference_urls: job.reference_urls?.length > 0 ? job.reference_urls : undefined,
      },
      {
        onSuccess: (data: ThumbnailJob) => {
          setActiveJobId(data._id);
          setSelectedConcept(null);
          setIterationFeedback("");
        },
      },
    );
  }

  function handleStartNew() {
    setActiveJobId(null);
    setSelectedConcept(null);
    setIterationFeedback("");
    setTopic("");
    setReferenceUrls([]);
  }

  return (
    <div className="max-w-[680px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[26px] font-bold text-white tracking-tight">YouTube Thumbnails</h1>
        {client && (
          <p className="text-[#555] text-[14px] mt-1">
            {client.name} — AI-crafted thumbnail concepts with competitor research
          </p>
        )}
      </div>

      {/* ─── Generating ─── */}
      {isGenerating && (
        <div className="bg-[#111] border border-[#222] rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-[#c9a84c]/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-5 w-5 text-[#c9a84c] animate-pulse" />
          </div>
          <h2 className="text-white text-[18px] font-bold mb-2">Generating Thumbnails...</h2>
          <p className="text-[#555] text-[14px] mb-5">
            {job?.current_step || job?.status || "Queued"}
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
              <button onClick={handleStartNew} className="text-[13px] text-[#c9a84c] hover:text-[#d4b55a] cursor-pointer">
                Try again
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── Results ─── */}
      {isCompleted && job && (
        <div className="space-y-6">
          {/* Pipeline info badges */}
          <div className="flex flex-wrap gap-2">
            {(job.example_count ?? 0) > 0 && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] bg-[#111] border border-[#222] text-[#888]">
                <Search className="h-3 w-3" />
                {job.example_count} competitor examples studied
              </span>
            )}
            {job.reference_urls?.length > 0 && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] bg-[#111] border border-[#222] text-[#888]">
                <Link className="h-3 w-3" />
                {job.reference_urls.length} reference image{job.reference_urls.length !== 1 ? "s" : ""}
              </span>
            )}
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] bg-[#111] border border-[#222] text-[#888]">
              <Palette className="h-3 w-3" />
              Brand style applied
            </span>
          </div>

          {/* Comparison grid */}
          {job.comparison_key && (
            <div>
              <label className="text-[#555] text-[11px] font-semibold uppercase tracking-wider block mb-3">
                Comparison Grid
              </label>
              <div className="bg-[#111] border border-[#222] rounded-2xl overflow-hidden">
                <img src={`/uploads/${job.comparison_key}`} alt="Thumbnail comparison grid" className="w-full" />
              </div>
            </div>
          )}

          {/* Individual concepts */}
          <div>
            <label className="text-[#555] text-[11px] font-semibold uppercase tracking-wider block mb-3">
              Pick a Direction
            </label>
            <div className="grid grid-cols-2 gap-3">
              {job.concepts
                .filter((c) => c.output_key)
                .map((concept) => (
                  <button
                    key={concept.label}
                    type="button"
                    onClick={() => setSelectedConcept(concept.label)}
                    className={`rounded-xl border overflow-hidden transition-all cursor-pointer text-left ${
                      selectedConcept === concept.label
                        ? "border-[#c9a84c] ring-1 ring-[#c9a84c]"
                        : "border-[#222] hover:border-[#333]"
                    }`}
                  >
                    <div className="aspect-video bg-[#0a0a0a]">
                      <img
                        src={`/uploads/${concept.output_key}`}
                        alt={`Concept ${concept.label.toUpperCase()}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3 bg-[#111]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white text-[13px] font-bold">{concept.label.toUpperCase()}</span>
                        {selectedConcept === concept.label && (
                          <div className="w-4 h-4 rounded-full bg-[#c9a84c] flex items-center justify-center">
                            <Check className="h-2.5 w-2.5 text-black" />
                          </div>
                        )}
                      </div>
                      <p className="text-[#555] text-[11px] leading-snug">{concept.description}</p>
                    </div>
                  </button>
                ))}
            </div>
          </div>

          {/* Iterations */}
          {job.iterations.length > 0 && (
            <div>
              <label className="text-[#555] text-[11px] font-semibold uppercase tracking-wider block mb-3">
                Iterations
              </label>
              <div className="grid grid-cols-2 gap-3">
                {job.iterations.map((iter, idx) => (
                  <div key={idx} className="rounded-xl border border-[#222] overflow-hidden">
                    <div className="aspect-video bg-[#0a0a0a]">
                      <img src={`/uploads/${iter.output_key}`} alt={`Version ${idx + 2}`} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-3 bg-[#111]">
                      <span className="text-white text-[13px] font-bold">v{idx + 2}</span>
                      <p className="text-[#555] text-[11px] mt-0.5">{iter.feedback}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Iterate form */}
          {selectedConcept && (
            <div>
              <label className="text-[#555] text-[11px] font-semibold uppercase tracking-wider block mb-3">
                Refine Concept {selectedConcept.toUpperCase()}
              </label>
              <textarea
                value={iterationFeedback}
                onChange={(e) => setIterationFeedback(e.target.value)}
                placeholder="Describe changes... e.g. 'Make the text bigger, use blue accents instead of orange, more dramatic expression'"
                rows={3}
                className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 text-white text-[13px] placeholder:text-[#444] focus:outline-none focus:border-[#c9a84c]/50 transition-colors resize-none"
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleIterate}
                  disabled={!iterationFeedback.trim() || iterateThumbnail.isPending}
                  className="flex-1 bg-[#c9a84c] text-black font-bold py-3 rounded-xl text-[13px] hover:bg-[#d4b55a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                >
                  {iterateThumbnail.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  {iterateThumbnail.isPending ? "Generating..." : "Iterate"}
                </button>
                <button
                  onClick={handleRegenerate}
                  disabled={generateThumbnails.isPending}
                  className="px-4 py-3 rounded-xl text-[13px] font-medium bg-[#111] border border-[#222] text-[#888] hover:text-white hover:border-[#333] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {generateThumbnails.isPending ? "Starting..." : "Regenerate"}
                </button>
                <button
                  onClick={handleStartNew}
                  className="px-4 py-3 rounded-xl text-[13px] font-medium bg-[#111] border border-[#222] text-[#888] hover:text-white hover:border-[#333] transition-all cursor-pointer"
                >
                  New Topic
                </button>
              </div>
            </div>
          )}

          {/* Regenerate / New — always visible */}
          {!selectedConcept && (
            <div className="flex gap-2">
              <button
                onClick={handleRegenerate}
                disabled={generateThumbnails.isPending}
                className="flex-1 bg-[#c9a84c] text-black font-bold py-3 rounded-xl text-[13px] hover:bg-[#d4b55a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {generateThumbnails.isPending ? "Starting..." : "Regenerate Same Topic"}
              </button>
              <button
                onClick={handleStartNew}
                className="px-4 py-3 rounded-xl text-[13px] font-medium bg-[#111] border border-[#222] text-[#888] hover:text-white hover:border-[#333] transition-all cursor-pointer"
              >
                New Topic
              </button>
            </div>
          )}

          {/* Download links */}
          <div className="flex flex-wrap gap-2">
            {job.concepts
              .filter((c) => c.output_key)
              .map((concept) => (
                <a
                  key={concept.label}
                  href={`/uploads/${concept.output_key}`}
                  download={`thumbnail-${concept.label}.png`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] text-[#888] bg-[#111] border border-[#222] hover:text-white hover:border-[#333] transition-all"
                >
                  <Download className="h-3 w-3" />
                  Download {concept.label.toUpperCase()}
                </a>
              ))}
            {job.iterations.map((iter, idx) => (
              <a
                key={idx}
                href={`/uploads/${iter.output_key}`}
                download={`thumbnail-v${idx + 2}.png`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] text-[#888] bg-[#111] border border-[#222] hover:text-white hover:border-[#333] transition-all"
              >
                <Download className="h-3 w-3" />
                Download v{idx + 2}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ─── Form ─── */}
      {!isGenerating && !isCompleted && (
        <div className="space-y-6">
          {/* Topic */}
          <div>
            <label className="text-[#555] text-[11px] font-semibold uppercase tracking-wider block mb-3">
              Video Topic or Title
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. How to Build AI Agents with Claude Code"
              className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 text-white text-[14px] placeholder:text-[#444] focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
            />
            <p className="text-[#444] text-[11px] mt-2">
              Claude will analyze this topic, define the desire loop, and craft 4 unique concept prompts. Competitor thumbnails from YouTube will be downloaded automatically as style inspiration.
            </p>
          </div>

          {/* Headshot selection */}
          <div>
            <label className="text-[#555] text-[11px] font-semibold uppercase tracking-wider block mb-3">
              Select Headshot
            </label>
            {headshotCandidates.length === 0 ? (
              <p className="text-[#444] text-[13px]">
                No images with visible faces found. Upload photos with clear face visibility first.
              </p>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {headshotCandidates.map((img) => (
                  <HeadshotCard
                    key={img._id}
                    image={img}
                    selected={selectedHeadshot === img._id}
                    onSelect={() => setSelectedHeadshot(img._id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Layout Template */}
          {templates.length > 0 && (
            <div>
              <label className="text-[#555] text-[11px] font-semibold uppercase tracking-wider block mb-3">
                Layout Template
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTemplate(null)}
                  className={`px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all cursor-pointer ${
                    !selectedTemplate
                      ? "bg-white text-black"
                      : "bg-[#111] border border-[#222] text-[#888] hover:text-white hover:border-[#333]"
                  }`}
                >
                  Auto
                </button>
                {templates.map((t) => (
                  <button
                    key={t._id}
                    type="button"
                    onClick={() => setSelectedTemplate(selectedTemplate === t._id ? null : t._id)}
                    className={`px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedTemplate === t._id
                        ? "bg-white text-black"
                        : "bg-[#111] border border-[#222] text-[#888] hover:text-white hover:border-[#333]"
                    }`}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    {t.name}
                  </button>
                ))}
              </div>
              {selectedTemplate && (
                <p className="text-[#555] text-[11px] mt-2">
                  {templates.find((t) => t._id === selectedTemplate)?.description}
                </p>
              )}
            </div>
          )}

          {/* Reference Images */}
          <div>
            <label className="text-[#555] text-[11px] font-semibold uppercase tracking-wider block mb-3">
              Reference Images (optional)
            </label>
            <p className="text-[#444] text-[11px] mb-3">
              Paste URLs to logos, icons, or screenshots that should appear in the thumbnail. Max 5.
            </p>

            {referenceUrls.length > 0 && (
              <div className="space-y-2 mb-3">
                {referenceUrls.map((url, i) => (
                  <div key={i} className="flex items-center gap-2 bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2">
                    <Link className="h-3 w-3 text-[#555] flex-shrink-0" />
                    <span className="text-[#888] text-[12px] truncate flex-1">{url}</span>
                    <button
                      type="button"
                      onClick={() => removeRefUrl(i)}
                      className="text-[#555] hover:text-[#e84057] cursor-pointer flex-shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {referenceUrls.length < 5 && (
              <div className="flex gap-2">
                <input
                  type="url"
                  value={newRefUrl}
                  onChange={(e) => setNewRefUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addRefUrl()}
                  placeholder="https://example.com/logo.png"
                  className="flex-1 bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-2.5 text-white text-[13px] placeholder:text-[#444] focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={addRefUrl}
                  disabled={!newRefUrl.trim() || !newRefUrl.startsWith("http")}
                  className="px-3 py-2.5 rounded-xl bg-[#111] border border-[#222] text-[#888] hover:text-white hover:border-[#333] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Pipeline info */}
          {client?.brand_kit && (
            <div className="bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <Palette className="h-3.5 w-3.5 text-[#c9a84c]" />
                <span className="text-[#888] text-[11px] font-medium">Brand style will be applied</span>
              </div>
              <p className="text-[#555] text-[11px]">
                {[
                  client.brand_kit.primary_color !== "#000000" && `Primary: ${client.brand_kit.primary_color}`,
                  client.brand_kit.accent_color && `Accent: ${client.brand_kit.accent_color}`,
                  client.brand_kit.font_heading && `Font: ${client.brand_kit.font_heading}`,
                ].filter(Boolean).join(" · ") || "Default brand colors"}
              </p>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!topic.trim() || !selectedHeadshot || generateThumbnails.isPending}
            className="w-full bg-[#c9a84c] text-black font-bold py-3.5 rounded-xl text-[15px] hover:bg-[#d4b55a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="h-4.5 w-4.5" />
            {generateThumbnails.isPending ? "Starting..." : "Generate 4 Thumbnail Concepts"}
          </button>

          {/* History */}
          {history.length > 0 && (
            <div>
              <label className="text-[#555] text-[11px] font-semibold uppercase tracking-wider block mb-3">
                Previous Generations
              </label>
              <div className="space-y-2">
                {history.map((h) => (
                  <button
                    key={h._id}
                    type="button"
                    onClick={() => {
                      if (h.status === "completed") {
                        setActiveJobId(h._id);
                        setSelectedConcept(null);
                        setIterationFeedback("");
                      }
                    }}
                    className="flex w-full items-center justify-between rounded-xl border border-[#222] bg-[#0a0a0a] p-3.5 text-left hover:border-[#333] transition-all cursor-pointer"
                  >
                    <div>
                      <p className="text-white text-[14px] font-medium">{h.topic}</p>
                      <p className="text-[#555] text-[12px] mt-0.5">
                        {h.concepts.filter((c) => c.output_key).length} concepts
                        {h.iterations.length > 0 && ` + ${h.iterations.length} iteration${h.iterations.length !== 1 ? "s" : ""}`}
                        {(h.example_count ?? 0) > 0 && ` · ${h.example_count} examples`}
                        {" | "}
                        {new Date(h.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        h.status === "completed"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : h.status === "failed"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-[#c9a84c]/10 text-[#c9a84c]"
                      }`}
                    >
                      {h.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HeadshotCard({
  image,
  selected,
  onSelect,
}: {
  image: ClientImage;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative rounded-xl overflow-hidden border transition-all cursor-pointer ${
        selected ? "border-[#c9a84c] ring-1 ring-[#c9a84c]" : "border-[#222] hover:border-[#333]"
      }`}
    >
      <div className="aspect-square bg-[#0a0a0a]">
        <img
          src={`/uploads/${image.thumbnail_key || image.storage_key}`}
          alt={image.original_filename}
          className="w-full h-full object-cover"
        />
      </div>
      {selected && (
        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#c9a84c] flex items-center justify-center">
          <Check className="h-3 w-3 text-black" />
        </div>
      )}
      {image.face_visibility_score > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 py-0.5">
          <span className="text-[9px] text-[#888]">Face: {image.face_visibility_score}%</span>
        </div>
      )}
    </button>
  );
}
