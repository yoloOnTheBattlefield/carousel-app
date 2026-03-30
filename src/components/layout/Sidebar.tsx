import { Link, useParams, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Images,
  FileText,
  Bookmark,
  LayoutTemplate,
  Sparkles,
  History,
  Eye,
  Film,
  CalendarDays,
  BarChart3,
  Plug,
  TrendingUp,
  RectangleVertical,
  ImageIcon,
  Search,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
  SidebarSeparator,
} from "@quddify/ui/sidebar";
import { useClient } from "@/hooks/useClients";

const mainLinks = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/clients", label: "Clients", icon: Users },
];

const toolLinks = [
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/reels", label: "Reels", icon: Film },
  { to: "/templates", label: "Templates", icon: LayoutTemplate },
  { to: "/styles", label: "Styles", icon: Sparkles },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
];

const clientContentLinks = [
  { to: "images", label: "Images", icon: Images },
  { to: "transcripts", label: "Transcripts", icon: FileText },
  { to: "swipe-file", label: "Swipe File", icon: Bookmark },
  { to: "content-research", label: "Research", icon: Eye },
  { to: "post-insights", label: "Post Insights", icon: TrendingUp },
];

const clientGenerateLinks = [
  { to: "generate", label: "Carousel", icon: Sparkles },
  { to: "stories", label: "Stories", icon: RectangleVertical },
  { to: "thumbnails", label: "Thumbnails", icon: ImageIcon },
];

const clientManageLinks = [
  { to: "history", label: "History", icon: History },
  { to: "integrations", label: "Integrations", icon: Plug },
];

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { id: clientId } = useParams<{ id: string }>();
  const location = useLocation();
  const { data: client } = useClient(clientId);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link to="/" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <LayoutDashboard className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Carousel</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {/* Search shortcut hint */}
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Search (⌘K)"
              onClick={() => {
                document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
              }}
              className="text-muted-foreground"
            >
              <Search />
              <span className="flex items-center justify-between flex-1">
                Search
                <kbd className="text-[10px] text-[#444] border border-[#222] rounded px-1 py-0.5 font-mono ml-auto">⌘K</kbd>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainLinks.map((link) => (
                <SidebarMenuItem key={link.to}>
                  <SidebarMenuButton
                    render={<Link to={link.to} />}
                    tooltip={link.label}
                    isActive={location.pathname === link.to}
                  >
                    <link.icon />
                    <span>{link.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Tools */}
        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolLinks.map((link) => (
                <SidebarMenuItem key={link.to}>
                  <SidebarMenuButton
                    render={<Link to={link.to} />}
                    tooltip={link.label}
                    isActive={location.pathname === link.to}
                  >
                    <link.icon />
                    <span>{link.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Client-specific sections */}
        {clientId && (
          <>
            <SidebarSeparator />

            {/* Client header */}
            <SidebarGroup>
              <SidebarGroupLabel>
                {client?.name || "Client"}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      render={<Link to={`/clients/${clientId}`} />}
                      tooltip="Overview"
                      isActive={location.pathname === `/clients/${clientId}`}
                    >
                      <Users />
                      <span>Overview</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Content Library */}
            <SidebarGroup>
              <SidebarGroupLabel>Content</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {clientContentLinks.map((link) => {
                    const fullPath = `/clients/${clientId}/${link.to}`;
                    return (
                      <SidebarMenuItem key={link.to}>
                        <SidebarMenuButton
                          render={<Link to={fullPath} />}
                          tooltip={link.label}
                          isActive={location.pathname === fullPath}
                        >
                          <link.icon />
                          <span>{link.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Generate */}
            <SidebarGroup>
              <SidebarGroupLabel>Generate</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {clientGenerateLinks.map((link) => {
                    const fullPath = `/clients/${clientId}/${link.to}`;
                    return (
                      <SidebarMenuItem key={link.to}>
                        <SidebarMenuButton
                          render={<Link to={fullPath} />}
                          tooltip={link.label}
                          isActive={location.pathname === fullPath}
                        >
                          <link.icon />
                          <span>{link.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Manage */}
            <SidebarGroup>
              <SidebarGroupLabel>Manage</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {clientManageLinks.map((link) => {
                    const fullPath = `/clients/${clientId}/${link.to}`;
                    return (
                      <SidebarMenuItem key={link.to}>
                        <SidebarMenuButton
                          render={<Link to={fullPath} />}
                          tooltip={link.label}
                          isActive={location.pathname === fullPath}
                        >
                          <link.icon />
                          <span>{link.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
