import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Plus,
  Images,
  Settings,
  LogOut,
  Users,
  ChevronsUpDown,
  Check,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
  SidebarSeparator,
} from "@quddify/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@quddify/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@quddify/ui/dialog";
import { Button } from "@quddify/ui/button";
import { Input } from "@quddify/ui/input";
import { Label } from "@quddify/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useSelectedClient } from "@/contexts/ClientContext";
import { useCreateClient } from "@/hooks/useClients";

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isClient } = useAuth();
  const { clients, selectedClient, setSelectedClientId } = useSelectedClient();
  const createClient = useCreateClient();
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPassword, setNewClientPassword] = useState("");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleCreateClient = () => {
    if (!newClientName.trim()) return;
    // Email/password are optional — leave blank to create a client for yourself
    // (no separate login is provisioned; the Client doc lives in your own account).
    const email = newClientEmail.trim();
    const password = newClientPassword.trim();
    if ((email && !password) || (!email && password)) return;
    const payload: Record<string, string> = { name: newClientName.trim() };
    if (email && password) {
      payload.email = email;
      payload.password = password;
    }
    createClient.mutate(
      payload,
      {
        onSuccess: (client: { _id: string }) => {
          setSelectedClientId(client._id);
          setShowNewClient(false);
          setNewClientName("");
          setNewClientEmail("");
          setNewClientPassword("");
        },
      },
    );
  };

  const initials = (() => {
    const parts = user?.name?.trim().split(/\s+/);
    if (!parts || parts.length === 0 || !parts[0]) return "?";
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  })();

  return (
    <>
    <Sidebar collapsible="icon" {...props}>
      {/* Client picker (hidden for users who are themselves someone's client) */}
      {!isClient && (
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  />
                }
              >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Users className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {selectedClient?.name || "Select client"}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                align="start"
                sideOffset={4}
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Clients
                  </DropdownMenuLabel>
                  {clients.map((client) => (
                    <DropdownMenuItem
                      key={client._id}
                      onClick={() => setSelectedClientId(client._id)}
                      className="gap-2 p-2"
                    >
                      <div className="flex size-6 items-center justify-center rounded-sm border">
                        <Users className="size-3 shrink-0" />
                      </div>
                      <span className="flex-1 truncate">{client.name}</span>
                      {client._id === selectedClient?._id && (
                        <Check className="size-4 shrink-0 text-muted-foreground" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowNewClient(true)} className="gap-2 p-2">
                  <div className="flex size-6 items-center justify-center rounded-sm border border-dashed">
                    <Plus className="size-3 shrink-0" />
                  </div>
                  <span>Add client</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      )}

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link to="/" />}
                  tooltip="Carousels"
                  isActive={location.pathname === "/"}
                >
                  <LayoutDashboard />
                  <span>Carousels</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link to="/create" />}
                  tooltip="New Carousel"
                  isActive={location.pathname === "/create"}
                >
                  <Plus />
                  <span>New Carousel</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link to="/images" />}
                  tooltip="Images"
                  isActive={location.pathname === "/images"}
                >
                  <Images />
                  <span>Images</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link to="/settings" />}
                  tooltip="Settings"
                  isActive={location.pathname === "/settings"}
                >
                  <Settings />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User footer */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  />
                }
              >
                  <div className="flex aspect-square size-6 items-center justify-center rounded-md bg-muted text-muted-foreground text-xs font-semibold">
                    {initials}
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user?.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="right"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground text-xs font-semibold">
                        {initials}
                      </div>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">{user?.name}</span>
                        <span className="truncate text-xs">{user?.email}</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 size-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>

    <Dialog open={showNewClient} onOpenChange={setShowNewClient}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Client</DialogTitle>
          <DialogDescription>
            Add a new client to your account. Leave email &amp; password blank to create a client for yourself (no separate login).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="client-name">Name</Label>
            <Input
              id="client-name"
              placeholder="Client name"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="client-email">Email <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              id="client-email"
              type="email"
              placeholder="client@example.com"
              value={newClientEmail}
              onChange={(e) => setNewClientEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="client-password">Password <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              id="client-password"
              type="password"
              placeholder="Min 6 characters"
              value={newClientPassword}
              onChange={(e) => setNewClientPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateClient()}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowNewClient(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateClient}
            disabled={
              !newClientName.trim() ||
              // If one of email/password is set, both must be set
              (!!newClientEmail.trim() !== !!newClientPassword.trim()) ||
              createClient.isPending
            }
          >
            {createClient.isPending ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
