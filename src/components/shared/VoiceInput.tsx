import { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import api from "@/lib/api";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setDuration(0);
        setRecording(false);

        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size < 1000) {
          setError("Recording too short");
          return;
        }

        setTranscribing(true);
        try {
          const form = new FormData();
          form.append("audio", blob, "recording.webm");
          const res = await api.post("/voice-notes/transcribe", form);
          if (res.data.text) {
            onTranscript(res.data.text);
          } else {
            setError("No speech detected");
          }
        } catch (err: unknown) {
          const e = err as { response?: { status?: number; data?: { error?: string } } };
          const status = e.response?.status;
          const serverMsg = e.response?.data?.error;
          if (status === 404) {
            setError("Transcription endpoint unavailable");
          } else if (serverMsg) {
            setError(serverMsg);
          } else {
            setError("Transcription failed");
          }
          console.error("Voice transcription failed:", err);
        } finally {
          setTranscribing(false);
        }
      };

      mediaRecorder.start(250);
      setRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch (err: unknown) {
      const e = err as { name?: string };
      if (e.name === "NotAllowedError") {
        setError("Microphone permission denied");
      } else if (e.name === "NotFoundError") {
        setError("No microphone found");
      } else {
        setError("Could not start recording");
      }
      console.error("Voice recording failed:", err);
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }

  function formatDuration(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  }

  if (transcribing) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#111] border border-[#222] text-[13px] text-[#888]"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        Transcribing...
      </button>
    );
  }

  if (recording) {
    return (
      <button
        onClick={stopRecording}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#e84057]/10 border border-[#e84057]/30 text-[13px] text-[#e84057] cursor-pointer animate-pulse"
      >
        <Square className="h-3.5 w-3.5 fill-current" />
        {formatDuration(duration)} — tap to stop
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={startRecording}
        disabled={disabled}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#111] border border-[#222] text-[13px] text-[#888] hover:text-white hover:border-[#333] transition-all cursor-pointer disabled:opacity-50"
        title="Record voice — transcribed to text"
      >
        <Mic className="h-4 w-4" />
        Voice
      </button>
      {error && (
        <span className="text-[11px] text-[#e84057] px-1">{error}</span>
      )}
    </div>
  );
}
