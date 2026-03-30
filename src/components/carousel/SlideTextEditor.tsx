import { useState, useRef, useCallback, useEffect, type CSSProperties } from "react";
import { cn } from "@quddify/ui";
import {
  Move,
  Type,
  Highlighter,
  Check,
  X,
  Plus,
  Minus,
  GripVertical,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

export interface TextOverlaySettings {
  /** X position as percentage (0-100) of container width */
  x: number;
  /** Y position as percentage (0-100) of container height */
  y: number;
  /** Font size in px */
  fontSize: number;
  /** Width as percentage (10-95) of container width */
  width: number;
  /** Indices of highlighted word spans: [startIdx, endIdx][] */
  highlights: [number, number][];
  /** Text alignment */
  textAlign: "left" | "center" | "right";
}

interface SlideTextEditorProps {
  imageSrc: string;
  copy: string;
  onCopyChange: (newCopy: string) => void;
  overlaySettings: TextOverlaySettings;
  onOverlayChange: (settings: TextOverlaySettings) => void;
  className?: string;
  lutPreview?: React.ReactNode;
  /** Aspect ratio string e.g. "4/5" or "9/16" */
  aspectRatio?: string;
}

const DEFAULT_SETTINGS: TextOverlaySettings = {
  x: 50,
  y: 50,
  fontSize: 28,
  width: 85,
  highlights: [],
  textAlign: "center",
};

export { DEFAULT_SETTINGS as defaultTextOverlaySettings };

// ── Component ──────────────────────────────────────────────────────────────

export function SlideTextEditor({
  imageSrc,
  copy,
  onCopyChange,
  overlaySettings,
  onOverlayChange,
  className,
  lutPreview,
  aspectRatio = "4/5",
}: SlideTextEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [editText, setEditText] = useState(copy);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [snappedAxis, setSnappedAxis] = useState<{ x: boolean; y: boolean }>({ x: false, y: false });
  const [dragWidth, setDragWidth] = useState<number | null>(null);
  const didDrag = useRef(false);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStart = useRef({ mouseX: 0, startWidth: 0 });

  // Sync editText when copy prop changes externally
  useEffect(() => {
    if (!isEditing) setEditText(copy);
  }, [copy, isEditing]);

  // ── Drag handling ──────────────────────────────────────────────────────

  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isEditing) return;

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      // Offset from text position to mouse
      const currentX = (overlaySettings.x / 100) * rect.width;
      const currentY = (overlaySettings.y / 100) * rect.height;
      dragOffset.current = {
        x: clientX - rect.left - currentX,
        y: clientY - rect.top - currentY,
      };

      // Lock the text width so it doesn't reflow during drag
      if (textRef.current) {
        setDragWidth(textRef.current.getBoundingClientRect().width);
      }
      didDrag.current = false;
      setIsDragging(true);
    },
    [isEditing, overlaySettings.x, overlaySettings.y],
  );

  useEffect(() => {
    if (!isDragging) return;

    const container = containerRef.current;
    if (!container) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      didDrag.current = true;
      const rect = container.getBoundingClientRect();
      const clientX =
        "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY =
        "touches" in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

      let x = ((clientX - rect.left - dragOffset.current.x) / rect.width) * 100;
      let y = ((clientY - rect.top - dragOffset.current.y) / rect.height) * 100;

      // Snap to center within 3% threshold
      const SNAP = 3;
      const snapX = Math.abs(x - 50) < SNAP;
      const snapY = Math.abs(y - 50) < SNAP;
      if (snapX) x = 50;
      if (snapY) y = 50;
      setSnappedAxis({ x: snapX, y: snapY });

      onOverlayChange({
        ...overlaySettings,
        x: Math.max(5, Math.min(95, x)),
        y: Math.max(5, Math.min(95, y)),
      });
    };

    const handleUp = () => {
      setIsDragging(false);
      setSnappedAxis({ x: false, y: false });
      setDragWidth(null);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, [isDragging, overlaySettings, onOverlayChange]);

  // ── Resize handling ─────────────────────────────────────────────────

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const container = containerRef.current;
      if (!container) return;
      resizeStart.current = {
        mouseX: e.clientX,
        startWidth: overlaySettings.width,
      };
      setIsResizing(true);
    },
    [overlaySettings.width],
  );

  useEffect(() => {
    if (!isResizing) return;
    const container = containerRef.current;
    if (!container) return;

    const handleMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      // Convert mouse delta to percentage of container width
      // Multiply by 2 because the box is centered (translate -50%), so each side moves
      const deltaPercent = ((e.clientX - resizeStart.current.mouseX) / rect.width) * 100 * 2;
      const newWidth = Math.max(15, Math.min(95, resizeStart.current.startWidth + deltaPercent));
      onOverlayChange({ ...overlaySettings, width: newWidth });
    };

    const handleUp = () => setIsResizing(false);

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isResizing, overlaySettings, onOverlayChange]);

  // ── Inline editing ────────────────────────────────────────────────────

  const startEditing = useCallback(() => {
    if (isHighlighting) return;
    setEditText(copy);
    setIsEditing(true);
  }, [copy, isHighlighting]);

  const commitEdit = useCallback(() => {
    const trimmed = editText.trim();
    setIsEditing(false);
    setEditText(trimmed);
    if (trimmed !== copy.trim()) {
      onCopyChange(trimmed);
    }
  }, [editText, copy, onCopyChange]);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditText(copy);
  }, [copy]);

  // Handle Enter (commit) and Escape (cancel) in edit mode
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        cancelEdit();
      }
      // Shift+Enter for newline, Enter alone commits
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        commitEdit();
      }
    },
    [commitEdit, cancelEdit],
  );

  // ── Highlight handling ────────────────────────────────────────────────

  const toggleWordHighlight = useCallback(
    (wordIndex: number) => {
      const existing = overlaySettings.highlights.findIndex(
        ([s, e]) => wordIndex >= s && wordIndex <= e,
      );
      let newHighlights: [number, number][];
      if (existing !== -1) {
        // Remove this highlight
        newHighlights = overlaySettings.highlights.filter(
          (_, i) => i !== existing,
        );
      } else {
        // Add single word highlight
        newHighlights = [...overlaySettings.highlights, [wordIndex, wordIndex]];
      }
      onOverlayChange({ ...overlaySettings, highlights: newHighlights });
    },
    [overlaySettings, onOverlayChange],
  );

  const isWordHighlighted = useCallback(
    (wordIndex: number) => {
      return overlaySettings.highlights.some(
        ([s, e]) => wordIndex >= s && wordIndex <= e,
      );
    },
    [overlaySettings.highlights],
  );

  // ── Font size ─────────────────────────────────────────────────────────

  const changeFontSize = useCallback(
    (delta: number) => {
      const next = Math.max(12, Math.min(72, overlaySettings.fontSize + delta));
      onOverlayChange({ ...overlaySettings, fontSize: next });
    },
    [overlaySettings, onOverlayChange],
  );

  const cycleTextAlign = useCallback(() => {
    const order: TextOverlaySettings["textAlign"][] = ["left", "center", "right"];
    const idx = order.indexOf(overlaySettings.textAlign);
    onOverlayChange({
      ...overlaySettings,
      textAlign: order[(idx + 1) % order.length],
    });
  }, [overlaySettings, onOverlayChange]);

  // ── Render helpers ────────────────────────────────────────────────────

  const words = copy.split(/\s+/).filter(Boolean);

  const renderTextContent = () => {
    if (isEditing) {
      return (
        <textarea
          autoFocus
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commitEdit}
          className="bg-transparent text-inherit font-inherit resize-none outline-none w-full min-h-[1.5em] border-none p-0"
          style={{
            fontSize: overlaySettings.fontSize,
            textAlign: overlaySettings.textAlign,
            lineHeight: 1.3,
            color: "inherit",
            fontFamily: "inherit",
          }}
          rows={Math.max(2, copy.split("\n").length)}
        />
      );
    }

    if (isHighlighting) {
      return (
        <span style={{ lineHeight: 1.3 }}>
          {words.map((word, i) => (
            <span key={i}>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWordHighlight(i);
                }}
                className={cn(
                  "cursor-pointer rounded px-0.5 transition-colors",
                  isWordHighlighted(i)
                    ? "bg-yellow-400/90 text-black"
                    : "hover:bg-white/20",
                )}
              >
                {word}
              </span>
              {i < words.length - 1 ? " " : ""}
            </span>
          ))}
        </span>
      );
    }

    // Normal display with highlights applied
    return (
      <span style={{ lineHeight: 1.3 }}>
        {words.map((word, i) => (
          <span key={i}>
            <span
              className={cn(
                isWordHighlighted(i) && "bg-yellow-400/90 text-black rounded px-0.5",
              )}
            >
              {word}
            </span>
            {i < words.length - 1 ? " " : ""}
          </span>
        ))}
      </span>
    );
  };

  const textStyle: CSSProperties = {
    position: "absolute",
    left: `${overlaySettings.x}%`,
    top: `${overlaySettings.y}%`,
    transform: "translate(-50%, -50%)",
    fontSize: overlaySettings.fontSize,
    textAlign: overlaySettings.textAlign,
    width: `${overlaySettings.width}%`,
    ...(dragWidth != null ? { width: dragWidth } : {}),
    color: "white",
    fontWeight: 700,
    textShadow: "0 2px 8px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.5)",
    cursor: isDragging ? "grabbing" : isEditing ? "text" : "pointer",
    userSelect: isEditing || isHighlighting ? "text" : "none",
    wordBreak: "break-word",
  };

  return (
    <div className={cn("relative group", className)}>
      {/* Image container */}
      <div
        ref={containerRef}
        className="relative rounded-lg bg-muted overflow-hidden select-none"
        style={{ aspectRatio }}
      >
        {/* Base image or LUT preview */}
        {lutPreview || (
          <img
            src={imageSrc}
            alt=""
            className="h-full w-full object-cover"
            draggable={false}
          />
        )}

        {/* Snap guides */}
        {isDragging && snappedAxis.x && (
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-[#c9a84c]/60 pointer-events-none z-10" />
        )}
        {isDragging && snappedAxis.y && (
          <div className="absolute left-0 right-0 top-1/2 h-px bg-[#c9a84c]/60 pointer-events-none z-10" />
        )}

        {/* Text overlay */}
        <div
          ref={textRef}
          style={textStyle}
          onMouseDown={!isEditing ? handleDragStart : undefined}
          onTouchStart={!isEditing ? handleDragStart : undefined}
          onClick={(e) => {
            if (didDrag.current) return;
            if (!isDragging && !isEditing && !isHighlighting) {
              e.stopPropagation();
              startEditing();
            }
          }}
          className={cn(
            "rounded-lg transition-shadow",
            !isEditing && !isHighlighting && "hover:ring-2 hover:ring-white/50",
            isEditing && "ring-2 ring-blue-400 bg-black/30 px-3 py-2",
            isHighlighting && "ring-2 ring-yellow-400/70 px-3 py-2",
            isDragging && "ring-2 ring-white/80",
          )}
        >
          {/* Drag handle */}
          {!isEditing && !isHighlighting && (
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-0.5 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                <GripVertical className="h-3 w-3" />
                drag to move · click to edit
              </div>
            </div>
          )}
          {renderTextContent()}

          {/* Resize handle — right edge */}
          {!isEditing && !isHighlighting && (
            <div
              onMouseDown={handleResizeStart}
              className="absolute top-0 -right-1.5 bottom-0 w-3 cursor-ew-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <div className="w-0.5 h-6 rounded-full bg-white/60" />
            </div>
          )}
        </div>

        {/* Edit mode action buttons */}
        {isEditing && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                commitEdit();
              }}
              className="flex items-center gap-1 bg-emerald-600 text-white text-xs px-2.5 py-1 rounded-md hover:bg-emerald-500 transition-colors"
            >
              <Check className="h-3 w-3" /> Save
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                cancelEdit();
              }}
              className="flex items-center gap-1 bg-red-600/80 text-white text-xs px-2.5 py-1 rounded-md hover:bg-red-500 transition-colors"
            >
              <X className="h-3 w-3" /> Cancel
            </button>
          </div>
        )}
      </div>

      {/* Controls toolbar */}
      <div className="flex items-center justify-between mt-2 px-1">
        {/* Font size */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => changeFontSize(-2)}
            className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Decrease font size"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="text-xs font-medium text-muted-foreground w-8 text-center tabular-nums">
            {overlaySettings.fontSize}
          </span>
          <button
            type="button"
            onClick={() => changeFontSize(2)}
            className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Increase font size"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Text align */}
        <button
          type="button"
          onClick={cycleTextAlign}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors"
          title="Change text alignment"
        >
          <Type className="h-3.5 w-3.5" />
          <span className="capitalize">{overlaySettings.textAlign}</span>
        </button>

        {/* Highlight toggle */}
        <button
          type="button"
          onClick={() => setIsHighlighting(!isHighlighting)}
          className={cn(
            "flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors",
            isHighlighting
              ? "bg-yellow-400/20 text-yellow-600 font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-muted",
          )}
          title={isHighlighting ? "Done highlighting" : "Highlight words"}
        >
          <Highlighter className="h-3.5 w-3.5" />
          {isHighlighting ? "Done" : "Highlight"}
        </button>

        {/* Position & width indicator */}
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
          <Move className="h-3 w-3" />
          {Math.round(overlaySettings.x)},{Math.round(overlaySettings.y)}
          <span className="text-muted-foreground/40">·</span>
          w{Math.round(overlaySettings.width)}%
        </div>
      </div>
    </div>
  );
}
