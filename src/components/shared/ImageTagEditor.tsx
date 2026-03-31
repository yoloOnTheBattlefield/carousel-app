import { useState, useRef, useEffect } from "react";
import { X, Plus, Tag } from "lucide-react";
import type { ClientImage } from "@/types";
import { useUpdateImageManualTags } from "@/hooks/useImages";

const SUGGESTED_TAGS = [
  "before",
  "after",
  "past",
  "current",
  "transformation",
  "results",
  "lifestyle",
  "headshot",
  "action",
  "testimonial",
  "behind the scenes",
  "cta",
];

interface ImageTagEditorProps {
  image: ClientImage;
  onClose: () => void;
}

export default function ImageTagEditor({ image, onClose }: ImageTagEditorProps) {
  const [tags, setTags] = useState<string[]>(image.manual_tags ?? []);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const updateTags = useUpdateImageManualTags();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function addTag(tag: string) {
    const normalized = tag.trim().toLowerCase();
    if (!normalized || tags.includes(normalized)) return;
    const next = [...tags, normalized];
    setTags(next);
    setInput("");
    updateTags.mutate({ id: image._id, manual_tags: next });
  }

  function removeTag(tag: string) {
    const next = tags.filter((t) => t !== tag);
    setTags(next);
    updateTags.mutate({ id: image._id, manual_tags: next });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
    if (e.key === "Escape") {
      onClose();
    }
  }

  const unusedSuggestions = SUGGESTED_TAGS.filter((s) => !tags.includes(s));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-[#111] border border-[#222] rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with image preview */}
        <div className="flex gap-4 p-5 border-b border-[#222]">
          <img
            src={image.thumbnail_url}
            alt={image.original_filename}
            className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-white text-[15px] font-semibold truncate">Tag Photo</h3>
              <button
                onClick={onClose}
                className="text-[#555] hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[#555] text-[12px] mt-1 truncate">{image.original_filename}</p>
            <p className="text-[#444] text-[11px] mt-0.5">
              Add tags like "before", "after", "current" to organize your photos
            </p>
          </div>
        </div>

        {/* Current Tags */}
        <div className="p-5 space-y-4">
          <div>
            <label className="text-[12px] text-[#555] font-medium uppercase tracking-wider mb-2 block">
              Tags
            </label>
            <div className="flex flex-wrap items-center gap-1.5 min-h-[40px] bg-[#0a0a0a] border border-[#222] rounded-xl p-2.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 bg-[#c9a84c]/15 text-[#c9a84c] text-[12px] font-medium px-2.5 py-1 rounded-lg"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={tags.length === 0 ? "Type a tag and press Enter..." : "Add more..."}
                className="flex-1 min-w-[100px] bg-transparent text-white text-[13px] outline-none placeholder:text-[#333]"
              />
            </div>
          </div>

          {/* Suggested Tags */}
          {unusedSuggestions.length > 0 && (
            <div>
              <label className="text-[12px] text-[#555] font-medium uppercase tracking-wider mb-2 block">
                Suggestions
              </label>
              <div className="flex flex-wrap gap-1.5">
                {unusedSuggestions.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => addTag(tag)}
                    className="inline-flex items-center gap-1 bg-[#1a1a1a] border border-[#222] text-[#888] text-[12px] px-2.5 py-1 rounded-lg hover:border-[#333] hover:text-white transition-all cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
