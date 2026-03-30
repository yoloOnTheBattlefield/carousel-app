import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@quddify/ui/card";
import { Button } from "@quddify/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@quddify/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@quddify/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@quddify/ui/table";
import { Input } from "@quddify/ui/input";
import { Label } from "@quddify/ui/label";
import { Textarea } from "@quddify/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@quddify/ui/select";
import { Badge } from "@quddify/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@quddify/ui/accordion";
import { Separator } from "@quddify/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@quddify/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@quddify/ui/tooltip";
import { Plus, FileText, RefreshCw, MoreHorizontal, Trash2, Eye, Play, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranscripts, useCreateTranscript, useReanalyzeTranscript, useDeleteTranscript } from "@/hooks/useTranscripts";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import type { Transcript } from "@/types";

const AI_MODELS = [
  { value: "gpt-4o", label: "GPT-4o", desc: "Best quality — ~$0.03/transcript" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini", desc: "Budget — ~$0.002/transcript" },
  { value: "claude-sonnet", label: "Claude Sonnet", desc: "Best nuance — ~$0.04/transcript (needs CLAUDE key)" },
];

function formatCallType(type: string) {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatShortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Strength indicator: dots + numeric score with tooltip
function StrengthIndicator({ score }: { score: number }) {
  const dots = Math.max(1, Math.round(score / 20)); // 0-100 → 1-5
  const color =
    score >= 80 ? "bg-emerald-500" :
    score >= 60 ? "bg-emerald-400" :
    score >= 40 ? "bg-amber-400" :
    score >= 20 ? "bg-orange-400" :
    "bg-red-400";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger render={<span className="inline-flex items-center gap-1.5" />}>
          <span className="inline-flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${i < dots ? color : "bg-muted"}`}
              />
            ))}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">{score}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p>Strength: {score}/100</p>
          <p className="text-xs opacity-75">Reflects how much usable content the AI found in this call.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Parse raw transcript into speaker blocks for chat-like display
function parseTranscriptBlocks(rawText: string) {
  const lines = rawText.split("\n").filter((l) => l.trim());
  const blocks: Array<{ speaker: string; timestamp: string; text: string }> = [];
  let currentBlock: { speaker: string; timestamp: string; text: string } | null = null;

  for (const line of lines) {
    // Match common Fathom patterns: "HH:MM:SS Speaker Name:" or "Speaker Name (HH:MM:SS):" etc.
    const match = line.match(/^(?:(\d{1,2}:\d{2}(?::\d{2})?)\s+)?([A-Z][a-zA-Z\s.'-]+?)(?:\s*\((\d{1,2}:\d{2}(?::\d{2})?)\))?\s*[:]\s*(.+)/);
    if (match) {
      const timestamp = match[1] || match[3] || "";
      const speaker = match[2].trim();
      const text = match[4].trim();
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = { speaker, timestamp, text };
    } else if (currentBlock) {
      currentBlock.text += " " + line.trim();
    } else {
      blocks.push({ speaker: "", timestamp: "", text: line.trim() });
    }
  }
  if (currentBlock) blocks.push(currentBlock);
  return blocks;
}

export default function TranscriptLibrary() {
  const { id: clientId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: transcripts = [], isLoading } = useTranscripts(clientId, {
    refetchInterval: (query) => {
      const data = query.state.data as Transcript[] | undefined;
      if (data?.some((t) => t.status === "processing" || t.status === "pending")) return 5000;
      return false;
    },
  });
  const hasProcessing = transcripts.some((t) => t.status === "processing" || t.status === "pending");

  const createTranscript = useCreateTranscript();
  const reanalyze = useReanalyzeTranscript();
  const deleteTranscript = useDeleteTranscript();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [rawText, setRawText] = useState("");
  const [callType, setCallType] = useState("generic");
  const [aiModel, setAiModel] = useState("gpt-4o");

  const [selectedTranscript, setSelectedTranscript] = useState<Transcript | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId) return;
    createTranscript.mutate(
      { client_id: clientId, title, raw_text: rawText, call_type: callType, ai_model: aiModel },
      {
        onSuccess: () => {
          setOpen(false);
          setTitle("");
          setRawText("");
          setCallType("generic");
        },
      }
    );
  }

  function openPanel(t: Transcript) {
    setSelectedTranscript(t);
    setSheetOpen(true);
  }

  function handleDelete(id: string) {
    deleteTranscript.mutate(id, {
      onSuccess: () => {
        toast.success("Transcript deleted");
        if (selectedTranscript?._id === id) {
          setSheetOpen(false);
          setSelectedTranscript(null);
        }
      },
    });
  }

  function handleReanalyze(id: string, model: string) {
    reanalyze.mutate(
      { id, ai_model: model },
      {
        onSuccess: () => toast.success("Re-processing started. This usually takes about a minute."),
        onError: () => toast.error("Failed to start re-processing. Please try again."),
      }
    );
  }

  if (isLoading) return <div className="py-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Transcripts</h1>
          {hasProcessing && (
            <span className="inline-flex items-center gap-1.5 text-xs text-blue-600">
              <Loader2 className="h-3 w-3 animate-spin" />
              Processing calls...
            </span>
          )}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" /> Add Transcript</Button>} />
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Transcript</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Prospect / Call Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Benjamin Huynh – Strategy Call" required />
                </div>
                <div className="space-y-2">
                  <Label>Call Type</Label>
                  <Select value={callType} onValueChange={(v) => { if (v) setCallType(v); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales_call">Sales Call</SelectItem>
                      <SelectItem value="coaching_call">Coaching Call</SelectItem>
                      <SelectItem value="content_brainstorm">Content Brainstorm</SelectItem>
                      <SelectItem value="generic">Generic</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>AI Model</Label>
                <Select value={aiModel} onValueChange={(v) => { if (v) setAiModel(v); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AI_MODELS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        <div className="flex items-center gap-2">
                          <span>{m.label}</span>
                          <span className="text-xs text-muted-foreground">{m.desc}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  All models use a 2-stage pipeline: GPT-4o Mini cleans the transcript first (~$0.001), then the selected model does deep extraction.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Transcript Text</Label>
                <Textarea value={rawText} onChange={(e) => setRawText(e.target.value)} rows={12} className="max-h-64 overflow-y-auto" placeholder="Paste the full Fathom transcript here..." required />
              </div>
              <Button type="submit" className="w-full" disabled={createTranscript.isPending}>
                {createTranscript.isPending ? "Saving..." : "Save Transcript"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      {transcripts.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-10 w-10" />}
          title="No transcripts yet"
          description="Paste a Fathom call transcript to extract carousel ideas"
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Call</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger render={<span className="cursor-help border-b border-dashed border-muted-foreground/40" />}>Strength</TooltipTrigger>
                        <TooltipContent>Reflects how much usable content the AI found in this call.</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transcripts.map((t) => (
                  <TableRow
                    key={t._id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => openPanel(t)}
                  >
                    {/* Call column: prospect name + call type subtitle */}
                    <TableCell>
                      <div>
                        <p className="font-medium">{t.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCallType(t.call_type)} — {formatShortDate(t.created_at)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{formatCallType(t.call_type)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {AI_MODELS.find((m) => m.value === t.ai_model)?.label || t.ai_model || "—"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {t.status === "ready" && t.overall_strength > 0 ? (
                        <StrengthIndicator score={t.overall_strength} />
                      ) : t.status === "processing" ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="inline-flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span key={i} className="h-1.5 w-1.5 rounded-full bg-muted animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                            ))}
                          </span>
                          <span className="text-[10px] text-muted-foreground">~1 min</span>
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell><StatusBadge status={t.status} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(t.created_at)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => e.stopPropagation()}
                            />
                          }
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openPanel(t); }}>
                            <Eye className="h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleReanalyze(t._id, t.ai_model); }}>
                            <RefreshCw className="h-4 w-4" />
                            Re-process
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onClick={(e) => { e.stopPropagation(); handleDelete(t._id); }}>
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Slide-over panel */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full max-w-150 flex flex-col overflow-hidden">
          {selectedTranscript && (
            <TranscriptPanel
              transcript={selectedTranscript}
              onReanalyze={handleReanalyze}
              isReanalyzing={reanalyze.isPending}
              clientId={clientId}
              navigate={navigate}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// Slide-over panel content
function TranscriptPanel({
  transcript: t,
  onReanalyze,
  isReanalyzing,
  clientId,
  navigate,
}: {
  transcript: Transcript;
  onReanalyze: (id: string, model: string) => void;
  isReanalyzing: boolean;
  clientId: string | undefined;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const [reprocessModel, setReprocessModel] = useState(t.ai_model || "gpt-4o");

  const transcriptBlocks = useMemo(() => parseTranscriptBlocks(t.raw_text), [t.raw_text]);

  const speakers = useMemo(() => {
    return [...new Set(transcriptBlocks.map((b) => b.speaker).filter(Boolean))];
  }, [transcriptBlocks]);

  const speakerColors: Record<string, { bg: string; border: string; label: string }> = {};
  const colorPalette = [
    { bg: "bg-blue-50", border: "border-l-blue-400", label: "text-blue-700" },
    { bg: "bg-gray-50", border: "border-l-gray-300", label: "text-gray-600" },
    { bg: "bg-violet-50", border: "border-l-violet-400", label: "text-violet-700" },
    { bg: "bg-amber-50", border: "border-l-amber-400", label: "text-amber-700" },
  ];
  speakers.forEach((s, i) => {
    speakerColors[s] = colorPalette[i % colorPalette.length];
  });

  const currentModelLabel = AI_MODELS.find((m) => m.value === t.ai_model)?.label || t.ai_model;

  return (
    <>
      {/* Panel Header */}
      <SheetHeader className="shrink-0 space-y-1 pr-8">
        <div className="min-w-0">
          <SheetTitle className="text-lg font-semibold leading-tight">{t.title}</SheetTitle>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{formatCallType(t.call_type)}</span>
            <span className="text-muted-foreground/40">·</span>
            <span>{formatDate(t.created_at)}</span>
            <span className="text-muted-foreground/40">·</span>
            <StatusBadge status={t.status} />
          </div>
        </div>

        {/* Recording link — disabled with tooltip explaining why */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger render={<span className="inline-flex pt-1" />}>
              <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-muted-foreground/50 cursor-not-allowed" disabled>
                <Play className="h-3 w-3" />
                Watch Recording
              </Button>
            </TooltipTrigger>
            <TooltipContent>No recording linked to this transcript. Upload a recording URL to enable playback.</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </SheetHeader>

      <Separator className="shrink-0" />

      {/* Scrollable content — explicit overflow container */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 -mx-4">
        {t.status === "ready" && t.extracted ? (
          <div className="space-y-4 py-4 px-4">
            {/* Strength + re-process controls — simplified (#3) */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                {t.overall_strength > 0 && <StrengthIndicator score={t.overall_strength} />}
                <span className="text-xs text-muted-foreground">Processed with {currentModelLabel}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Select value={reprocessModel} onValueChange={(v) => { if (v) setReprocessModel(v); }}>
                  <SelectTrigger className="h-7 w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_MODELS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        <span className="text-xs">{m.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs"
                  disabled={isReanalyzing}
                  onClick={() => onReanalyze(t._id, reprocessModel)}
                >
                  <RefreshCw className={`h-3 w-3 ${isReanalyzing ? "animate-spin" : ""}`} />
                  Re-run
                </Button>
              </div>
            </div>

            {/* Extracted insights accordion — only Pain Points open by default (#14) */}
            <Accordion className="w-full" multiple defaultValue={["pain_points"]}>
              {t.extracted.pain_points.length > 0 && (
                <AccordionItem value="pain_points">
                  <AccordionTrigger>Pain Points ({t.extracted.pain_points.length})</AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2">
                      {t.extracted.pain_points.map((p, i) => (
                        <li key={i} className="flex items-start justify-between gap-2 text-sm">
                          <span>{p.text}</span>
                          <Badge variant="outline" className="shrink-0">{p.strength}/10</Badge>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              )}
              {t.extracted.quotes.length > 0 && (
                <AccordionItem value="quotes">
                  <AccordionTrigger>Quotes ({t.extracted.quotes.length})</AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2">
                      {t.extracted.quotes.map((q, i) => (
                        <li key={i} className="text-sm">
                          <p className="italic">&ldquo;{q.text}&rdquo;</p>
                          {q.speaker && <p className="mt-1 text-xs text-muted-foreground">— {q.speaker}</p>}
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              )}
              {t.extracted.objections.length > 0 && (
                <AccordionItem value="objections">
                  <AccordionTrigger>Objections ({t.extracted.objections.length})</AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2">
                      {t.extracted.objections.map((o, i) => (
                        <li key={i} className="flex items-start justify-between gap-2 text-sm">
                          <span>{o.text}</span>
                          <Badge variant="outline" className="shrink-0">{o.strength}/10</Badge>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              )}
              {t.extracted.teaching_moments.length > 0 && (
                <AccordionItem value="teaching">
                  <AccordionTrigger>Teaching Moments ({t.extracted.teaching_moments.length})</AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2">
                      {t.extracted.teaching_moments.map((tm, i) => (
                        <li key={i} className="text-sm">{tm.text}</li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              )}
              {t.extracted.story_moments && t.extracted.story_moments.length > 0 && (
                <AccordionItem value="stories">
                  <AccordionTrigger>Story Moments ({t.extracted.story_moments.length})</AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2">
                      {t.extracted.story_moments.map((sm, i) => (
                        <li key={i} className="flex items-start justify-between gap-2 text-sm">
                          <span>{sm.text}</span>
                          <Badge variant="outline" className="shrink-0">{sm.emotional_weight}/10</Badge>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              )}
              {t.extracted.topic_clusters.length > 0 && (
                <AccordionItem value="topics">
                  <AccordionTrigger>Topic Clusters ({t.extracted.topic_clusters.length})</AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-3">
                      {t.extracted.topic_clusters.map((tc, i) => (
                        <li key={i}>
                          <p className="font-medium text-sm">{tc.topic}</p>
                          <ul className="mt-1 ml-4 space-y-1">
                            {tc.excerpts.map((ex, j) => (
                              <li key={j} className="text-xs text-muted-foreground">{ex}</li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Raw transcript with chat-like readability */}
              <AccordionItem value="raw_transcript">
                <AccordionTrigger>Full Transcript</AccordionTrigger>
                <AccordionContent>
                  <TranscriptChatView blocks={transcriptBlocks} speakerColors={speakerColors} />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        ) : (
          <div className="space-y-4 py-4 px-4">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={t.status} />
              {(t.status === "failed" || t.status === "pending") && (
                <div className="flex items-center gap-1.5">
                  <Select value={reprocessModel} onValueChange={(v) => { if (v) setReprocessModel(v); }}>
                    <SelectTrigger className="h-7 w-28 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AI_MODELS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          <span className="text-xs">{m.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs"
                    disabled={isReanalyzing}
                    onClick={() => onReanalyze(t._id, reprocessModel)}
                  >
                    <RefreshCw className={`h-3 w-3 ${isReanalyzing ? "animate-spin" : ""}`} />
                    Re-run
                  </Button>
                </div>
              )}
            </div>

            {t.status === "processing" && (
              <div className="flex items-center gap-2 rounded-md bg-blue-50 p-3 text-sm text-blue-700">
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                <span>AI is analyzing this transcript. Usually takes about a minute — this page updates automatically.</span>
              </div>
            )}

            {/* Raw transcript with chat-like readability */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Raw Transcript</p>
              <TranscriptChatView blocks={transcriptBlocks} speakerColors={speakerColors} maxBlocks={30} />
              {transcriptBlocks.length > 30 && (
                <p className="text-xs text-muted-foreground pt-2">Showing first 30 blocks of {transcriptBlocks.length}...</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sticky footer CTA */}
      <Separator className="shrink-0" />
      <SheetFooter className="shrink-0 flex-row gap-2 pt-2 pb-2">
        <Button
          className="flex-1 gap-2"
          onClick={() => {
            if (clientId) {
              navigate(`/clients/${clientId}/generate`, { state: { selectedTranscriptIds: [t._id] } });
            }
          }}
          disabled={t.status !== "ready"}
        >
          <Sparkles className="h-4 w-4" />
          Generate Carousel from this Call
        </Button>
      </SheetFooter>
    </>
  );
}

// Chat-like transcript view with speaker colors and grouped blocks
function TranscriptChatView({
  blocks,
  speakerColors,
  maxBlocks,
}: {
  blocks: Array<{ speaker: string; timestamp: string; text: string }>;
  speakerColors: Record<string, { bg: string; border: string; label: string }>;
  maxBlocks?: number;
}) {
  const displayBlocks = maxBlocks ? blocks.slice(0, maxBlocks) : blocks;

  if (displayBlocks.length === 0) {
    return <p className="text-sm text-muted-foreground italic">No transcript content.</p>;
  }

  return (
    <div className="space-y-1">
      {displayBlocks.map((block, i) => {
        const colors = block.speaker ? speakerColors[block.speaker] : null;
        return (
          <div
            key={i}
            className={`rounded-md border-l-2 px-3 py-2 text-sm ${
              colors ? `${colors.bg} ${colors.border}` : "bg-muted/30 border-l-transparent"
            }`}
          >
            {block.speaker && (
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-xs font-medium ${colors?.label || "text-muted-foreground"}`}>
                  {block.speaker}
                </span>
                {block.timestamp && (
                  <span className="text-[10px] text-muted-foreground/50">{block.timestamp}</span>
                )}
              </div>
            )}
            <p className="text-sm leading-relaxed text-foreground/90">{block.text}</p>
          </div>
        );
      })}
    </div>
  );
}
