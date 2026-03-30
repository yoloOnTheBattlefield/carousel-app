import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Command } from "cmdk";
import {
  LayoutDashboard, Users, CalendarDays, Film, LayoutTemplate,
  BarChart3, Images, FileText, Bookmark, Eye, TrendingUp,
  Sparkles, History, Plug, Search, RectangleVertical, ImageIcon,
} from "lucide-react";
import { useClients } from "@/hooks/useClients";

const globalCommands = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard, group: "Navigate" },
  { label: "Clients", path: "/clients", icon: Users, group: "Navigate" },
  { label: "Content Calendar", path: "/calendar", icon: CalendarDays, group: "Navigate" },
  { label: "Reels Generator", path: "/reels", icon: Film, group: "Navigate" },
  { label: "Templates", path: "/templates", icon: LayoutTemplate, group: "Navigate" },
  { label: "Analytics", path: "/analytics", icon: BarChart3, group: "Navigate" },
  { label: "Carousel Styles", path: "/styles", icon: Sparkles, group: "Navigate" },
  { label: "Onboard New Client", path: "/onboard", icon: Users, group: "Actions" },
];

const clientSubpages = [
  { label: "Images", path: "images", icon: Images },
  { label: "Transcripts", path: "transcripts", icon: FileText },
  { label: "Swipe File", path: "swipe-file", icon: Bookmark },
  { label: "Content Research", path: "content-research", icon: Eye },
  { label: "Post Insights", path: "post-insights", icon: TrendingUp },
  { label: "Generate Carousel", path: "generate", icon: Sparkles },
  { label: "Generate Story", path: "stories", icon: RectangleVertical },
  { label: "Thumbnails", path: "thumbnails", icon: ImageIcon },
  { label: "History", path: "history", icon: History },
  { label: "Integrations", path: "integrations", icon: Plug },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: clients = [] } = useClients();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const clientCommands = useMemo(() => {
    return clients.flatMap((client) => [
      {
        label: client.name,
        path: `/clients/${client._id}`,
        icon: Users,
        group: "Clients",
        keywords: [client.niche, client.slug],
      },
      ...clientSubpages.map((sub) => ({
        label: `${client.name} — ${sub.label}`,
        path: `/clients/${client._id}/${sub.path}`,
        icon: sub.icon,
        group: "Client Pages",
        keywords: [client.name, sub.label],
      })),
    ]);
  }, [clients]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="fixed inset-x-0 top-[20%] mx-auto max-w-lg" onClick={(e) => e.stopPropagation()}>
        <Command
          className="rounded-2xl border border-[#222] bg-[#111] shadow-2xl shadow-black/60 overflow-hidden"
          filter={(value, search) => {
            if (value.toLowerCase().includes(search.toLowerCase())) return 1;
            return 0;
          }}
        >
          <div className="flex items-center gap-3 border-b border-[#1a1a1a] px-4">
            <Search className="h-4 w-4 text-[#555] flex-shrink-0" />
            <Command.Input
              placeholder="Search pages, clients, actions..."
              className="flex-1 bg-transparent text-white text-[14px] placeholder:text-[#444] py-4 focus:outline-none"
              autoFocus
            />
            <kbd className="text-[10px] text-[#444] border border-[#222] rounded px-1.5 py-0.5 font-mono">ESC</kbd>
          </div>
          <Command.List className="max-h-[320px] overflow-y-auto py-2">
            <Command.Empty className="py-8 text-center text-[13px] text-[#555]">
              No results found.
            </Command.Empty>

            <Command.Group heading="Navigate" className="px-2">
              {globalCommands
                .filter((c) => c.group === "Navigate")
                .map((cmd) => (
                  <Command.Item
                    key={cmd.path}
                    value={cmd.label}
                    onSelect={() => {
                      navigate(cmd.path);
                      setOpen(false);
                    }}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] text-[#888] cursor-pointer data-[selected=true]:bg-[#1a1a1a] data-[selected=true]:text-white transition-colors"
                  >
                    <cmd.icon className="h-4 w-4 flex-shrink-0" />
                    {cmd.label}
                  </Command.Item>
                ))}
            </Command.Group>

            <Command.Group heading="Actions" className="px-2">
              {globalCommands
                .filter((c) => c.group === "Actions")
                .map((cmd) => (
                  <Command.Item
                    key={cmd.path}
                    value={cmd.label}
                    onSelect={() => {
                      navigate(cmd.path);
                      setOpen(false);
                    }}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] text-[#888] cursor-pointer data-[selected=true]:bg-[#1a1a1a] data-[selected=true]:text-white transition-colors"
                  >
                    <cmd.icon className="h-4 w-4 flex-shrink-0" />
                    {cmd.label}
                  </Command.Item>
                ))}
            </Command.Group>

            {clients.length > 0 && (
              <Command.Group heading="Clients" className="px-2">
                {clientCommands.map((cmd) => (
                  <Command.Item
                    key={cmd.path}
                    value={[cmd.label, ...(cmd.keywords || [])].join(" ")}
                    onSelect={() => {
                      navigate(cmd.path);
                      setOpen(false);
                    }}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] text-[#888] cursor-pointer data-[selected=true]:bg-[#1a1a1a] data-[selected=true]:text-white transition-colors"
                  >
                    <cmd.icon className="h-4 w-4 flex-shrink-0" />
                    {cmd.label}
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>

          <div className="border-t border-[#1a1a1a] px-4 py-2 flex items-center justify-between text-[10px] text-[#444]">
            <span>Navigate with arrow keys</span>
            <div className="flex items-center gap-2">
              <span>Open</span>
              <kbd className="border border-[#222] rounded px-1 py-0.5 font-mono">Enter</kbd>
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
}
