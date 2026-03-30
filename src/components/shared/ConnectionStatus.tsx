import { useState, useEffect } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { getSocket } from "@/lib/socket";

export function ConnectionStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  const [socketConnected, setSocketConnected] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    function handleOnline() {
      setOnline(true);
    }
    function handleOffline() {
      setOnline(false);
      setShowBanner(true);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const socket = getSocket();

    function onConnect() {
      setSocketConnected(true);
      setShowBanner(false);
    }
    function onDisconnect() {
      setSocketConnected(false);
      setShowBanner(true);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    setSocketConnected(socket.connected);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  // Auto-hide reconnected banner
  useEffect(() => {
    if (online && socketConnected && showBanner) {
      const timer = setTimeout(() => setShowBanner(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [online, socketConnected, showBanner]);

  if (!showBanner) return null;

  const isConnected = online && socketConnected;

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-medium shadow-lg transition-all ${
        isConnected
          ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
          : "bg-[#e84057]/10 border border-[#e84057]/30 text-[#e84057]"
      }`}
    >
      {isConnected ? (
        <>
          <Wifi className="h-3.5 w-3.5" />
          Reconnected
        </>
      ) : (
        <>
          <WifiOff className="h-3.5 w-3.5" />
          {!online ? "You're offline" : "Connection lost — retrying..."}
        </>
      )}
    </div>
  );
}
