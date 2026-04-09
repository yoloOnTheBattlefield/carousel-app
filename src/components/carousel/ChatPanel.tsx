import { useState, useRef } from "react";
import { Send, Loader2, Sparkles } from "lucide-react";
import { useChatEdit } from "@/hooks/useChatEdit";

const QUICK_ACTIONS = [
  "Make the hook punchier",
  "Shorten all copy",
  "Swap the image on slide 1",
  "Use a brighter photo for the hook",
  "Make the CTA more urgent",
  "Change slide 3 to a different image",
];

interface ChatPanelProps {
  carouselId: string;
}

export function ChatPanel({ carouselId }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<Array<{ role: "user" | "assistant"; text: string }>>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const chatEdit = useChatEdit(carouselId);

  function handleSend() {
    const text = input.trim();
    if (!text || chatEdit.isPending) return;
    setInput("");
    setHistory((h) => [...h, { role: "user", text }]);

    chatEdit.mutate(text, {
      onSuccess: (data) => {
        setHistory((h) => [...h, { role: "assistant", text: data.assistant_message }]);
      },
      onError: () => {
        setHistory((h) => [...h, { role: "assistant", text: "Something went wrong. Try again." }]);
      },
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-full border border-[#222] rounded-2xl bg-[#111] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#222]">
        <Sparkles className="h-4 w-4 text-[#c9a84c]" />
        <h3 className="text-white text-[14px] font-semibold">Edit with AI</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <Sparkles className="h-8 w-8 text-[#222] mb-3" />
            <p className="text-[#555] text-[13px] font-medium">Chat to edit your slides</p>
            <p className="text-[#333] text-[12px] mt-1 max-w-55">
              Edit copy or swap images — "Make slide 3 punchier" or "Use a different photo on slide 1"
            </p>
          </div>
        ) : (
          history.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#c9a84c] text-black rounded-br-md"
                    : "bg-[#1a1a1a] border border-[#222] text-[#ccc] rounded-bl-md"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))
        )}

        {chatEdit.isPending && (
          <div className="flex justify-start">
            <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl rounded-bl-md px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-[#555]" />
            </div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      {history.length === 0 && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-1.5">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action}
                onClick={() => {
                  setInput(action);
                  inputRef.current?.focus();
                }}
                className="text-[11px] text-[#555] bg-[#0a0a0a] border border-[#222] px-2.5 py-1 rounded-lg hover:border-[#333] hover:text-[#888] transition-all cursor-pointer"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-[#222]">
        <div className="flex items-end gap-2 bg-[#0a0a0a] border border-[#222] rounded-xl p-2 focus-within:border-[#c9a84c] transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell AI what to change..."
            rows={1}
            className="flex-1 bg-transparent text-white text-[13px] placeholder:text-[#333] outline-none resize-none min-h-[24px] max-h-[120px]"
            style={{ height: "auto" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || chatEdit.isPending}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#c9a84c] text-black hover:bg-[#d4b55a] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
