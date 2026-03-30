import { Outlet, useParams, useLocation, Link } from "react-router-dom";
import { AppSidebar } from "./Sidebar";
import { NotificationBell } from "./NotificationBell";
import { CommandPalette } from "@/components/shared/CommandPalette";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@quddify/ui/sidebar";
import { Separator } from "@quddify/ui/separator";
import { useClient } from "@/hooks/useClients";
import { ChevronRight, Search } from "lucide-react";

function Breadcrumbs() {
  const { id: clientId, carouselId } = useParams<{ id: string; carouselId: string }>();
  const location = useLocation();
  const { data: client } = useClient(clientId);

  if (!clientId) return null;

  const pathAfterClient = location.pathname.replace(`/clients/${clientId}`, "").replace(/^\//, "");
  const segment = pathAfterClient.split("/")[0];

  const segmentLabels: Record<string, string> = {
    images: "Images",
    luts: "LUTs",
    transcripts: "Transcripts",
    "swipe-file": "Swipe File",
    "content-research": "Content Research",
    "post-insights": "Post Insights",
    generate: "Generate",
    stories: "Stories",
    thumbnails: "Thumbnails",
    history: "History",
    carousels: "Carousel",
    integrations: "Integrations",
  };

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground">
      <Link to="/clients" className="hover:text-foreground transition-colors">Clients</Link>
      <ChevronRight className="h-3 w-3" />
      <Link to={`/clients/${clientId}`} className="hover:text-foreground transition-colors">
        {client?.name || "..."}
      </Link>
      {segment && segmentLabels[segment] && (
        <>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">{segmentLabels[segment]}</span>
        </>
      )}
    </nav>
  );
}

export function AppShell() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumbs />
          <div className="flex-1" />
          {/* Quick search button */}
          <button
            onClick={() => {
              document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
            }}
            className="hidden md:flex items-center gap-2 bg-[#111] border border-[#222] rounded-lg px-3 py-1.5 text-[12px] text-[#555] hover:border-[#333] hover:text-[#888] transition-all cursor-pointer"
          >
            <Search className="h-3 w-3" />
            Search...
            <kbd className="text-[10px] text-[#444] border border-[#222] rounded px-1 py-0.5 font-mono ml-2">⌘K</kbd>
          </button>
          <NotificationBell />
        </header>
        <div className="flex flex-1 flex-col">
          <div className="mx-auto w-full max-w-6xl p-6">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
      <CommandPalette />
    </SidebarProvider>
  );
}
