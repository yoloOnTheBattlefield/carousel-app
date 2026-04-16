import { Outlet, useParams, useLocation, Link } from "react-router-dom";
import { AppSidebar } from "./Sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@quddify/ui/sidebar";
import { Separator } from "@quddify/ui/separator";
import { useCarousel } from "@/hooks/useCarousels";
import { useSelectedClient } from "@/contexts/ClientContext";
import { ChevronRight } from "lucide-react";

function Breadcrumbs() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { selectedClient } = useSelectedClient();

  // Carousel editor breadcrumb
  const isCarouselEditor = location.pathname.startsWith("/carousels/");
  const { data: carousel } = useCarousel(isCarouselEditor ? id : undefined);

  if (location.pathname === "/create") {
    return (
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground transition-colors">Carousels</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">New</span>
      </nav>
    );
  }

  if (location.pathname === "/outreach") {
    return (
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground transition-colors">Carousels</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">Outreach</span>
      </nav>
    );
  }

  if (isCarouselEditor && carousel) {
    return (
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground transition-colors">Carousels</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium truncate max-w-[200px]">
          {carousel.angle?.chosen_angle || carousel.slides?.[0]?.copy?.slice(0, 50) || "Carousel"}
        </span>
      </nav>
    );
  }

  if (location.pathname === "/images" && selectedClient) {
    return (
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <span className="text-muted-foreground">Photos</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">{selectedClient.name}</span>
      </nav>
    );
  }

  if (location.pathname === "/settings" && selectedClient) {
    return (
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <span className="text-muted-foreground">Settings</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">{selectedClient.name}</span>
      </nav>
    );
  }

  return null;
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
        </header>
        <div className="flex flex-1 flex-col">
          <div className="mx-auto w-full max-w-6xl p-6">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
