import { useState, useRef, useEffect } from "react";
import { Send, Loader2, MessageSquare, Sparkles } from "lucide-react";
import { useChatEdit } from "@/hooks/useChatEdit";
import { cn } from "@quddify/ui";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  slidesChanged?: number[];
}

interface ChatPanelProps {
  carouselId: string;
}

const SUGGESTIONS = [
  "Make slide 1 punchier",
  "Shorten all the copy",
  "Add a stat to slide 3",
  "Make the CTA more urgent",
  "Rewrite slide 2 as a question",
];

export function ChatPanel({ carouselId }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const chatEdit = useChatEdit();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, chatEdit.isPending]);

  function handleSend(text?: string) {
    const message = (text || input).trim();
    if (!message || chatEdit.isPending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: message,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    chatEdit.mutate(
      { carouselId, message },
      {
        onSuccess: (data) => {
          const assistantMsg: ChatMessage = {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            text: data.assistant_message,
            slidesChanged: data.updated_slides.map((s) => s.position),
          };
          setMessages((prev) => [...prev, assistantMsg]);
        },
        onError: (err) => {
          const errorMsg: ChatMessage = {
            id: `error-${Date.now()}`,
            role: "assistant",
            text: `Something went wrong: ${err.message}. Try again.`,
          };
          setMessages((prev) => [...prev, errorMsg]);
        },
      },
    );
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const showSuggestions = messages.length === 0 && !chatEdit.isPending;

  return (
    <div className="bg-[#111] border border-[#222] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1a1a1a]">
        <MessageSquare className="h-4 w-4 text-[#c9a84c]" />
        <h3 className="text-white text-[13px] font-semibold">Edit with AI</h3>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="max-h-[280px] overflow-y-auto px-4 py-3 space-y-3">
        {showSuggestions && (
          <div className="space-y-2">
            <p className="text-[#555] text-[11px]">Try something like:</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSend(s)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#1a1a1a] border border-[#222] text-[#888] text-[11px] hover:border-[#333] hover:text-white transition-all cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex",
              msg.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-xl px-3 py-2 text-[13px] leading-relaxed",
                msg.role === "user"
                  ? "bg-[#c9a84c] text-black"
                  : "bg-[#1a1a1a] text-[#ccc]",
              )}
            >
              {msg.text}
              {msg.slidesChanged && msg.slidesChanged.length > 0 && (
                <span className="block text-[10px] mt-1 opacity-60">
                  Updated slide{msg.slidesChanged.length > 1 ? "s" : ""}{" "}
                  {msg.slidesChanged.join(", ")}
                </span>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {chatEdit.isPending && (
          <div className="flex justify-start">
            <div className="bg-[#1a1a1a] rounded-xl px-3 py-2 flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-[#c9a84c] animate-pulse" />
              <span className="text-[#555] text-[12px]">Editing slides...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-[#1a1a1a] px-3 py-2.5">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. make slide 3 punchier..."
            disabled={chatEdit.isPending}
            className="flex-1 bg-transparent text-white text-[13px] placeholder:text-[#444] outline-none disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!input.trim() || chatEdit.isPending}
            className="w-8 h-8 rounded-lg bg-[#c9a84c] flex items-center justify-center text-black hover:bg-[#d4b55a] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
          >
            {chatEdit.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
