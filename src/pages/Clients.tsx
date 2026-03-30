import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@quddify/ui/card";
import { Button } from "@quddify/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@quddify/ui/dialog";
import { Input } from "@quddify/ui/input";
import { Label } from "@quddify/ui/label";
import { Badge } from "@quddify/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@quddify/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@quddify/ui/select";
import { Plus, Wand2, Search, AlertCircle } from "lucide-react";
import { useClients, useCreateClient } from "@/hooks/useClients";
import { EmptyState } from "@/components/shared/EmptyState";

function isSetupComplete(client: { brand_kit: any; voice_profile: any }): boolean {
  const hasBrand = !!(client.brand_kit?.primary_color || client.brand_kit?.font_heading);
  const hasVoice = !!(client.voice_profile?.raw_text);
  return hasBrand && hasVoice;
}

export default function Clients() {
  const { data: clients = [], isLoading } = useClients();
  const createClient = useCreateClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [niche, setNiche] = useState("fitness");
  const [salesRepName, setSalesRepName] = useState("Jorden");
  const [search, setSearch] = useState("");
  const [nicheFilter, setNicheFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    createClient.mutate({ name, slug, niche, sales_rep_name: salesRepName }, {
      onSuccess: () => {
        setOpen(false);
        setName("");
        setSlug("");
        setNiche("fitness");
        setSalesRepName("Jorden");
      },
    });
  }

  const niches = useMemo(() => [...new Set(clients.map((c) => c.niche).filter(Boolean))], [clients]);

  const filteredClients = useMemo(() => {
    let result = clients.filter((c) => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (nicheFilter !== "all" && c.niche !== nicheFilter) return false;
      return true;
    });

    result.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === "niche") return (a.niche || "").localeCompare(b.niche || "");
      return 0;
    });

    return result;
  }, [clients, search, nicheFilter, sortBy]);

  if (isLoading) return <div className="py-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clients</h1>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" render={<Link to="/onboard" />}>
                  <Wand2 className="mr-2 h-4 w-4" /> Onboard Client
                </Button>
              </TooltipTrigger>
              <TooltipContent>Guided setup with brand kit, voice profile, and image upload</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Dialog open={open} onOpenChange={setOpen}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" /> Quick Add</Button>} />
              </TooltipTrigger>
              <TooltipContent>Create a client with just name and niche — configure details later</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Client</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Client name" required />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} placeholder="client-slug" required />
              </div>
              <div className="space-y-2">
                <Label>Niche</Label>
                <Input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="fitness" />
              </div>
              <div className="space-y-2">
                <Label>Sales Rep Name</Label>
                <Input value={salesRepName} onChange={(e) => setSalesRepName(e.target.value)} placeholder="Jorden" />
              </div>
              <Button type="submit" className="w-full" disabled={createClient.isPending}>
                {createClient.isPending ? "Creating..." : "Create Client"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Search & Filter Bar */}
      {clients.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {niches.length > 1 && (
            <Select value={nicheFilter} onValueChange={setNicheFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All niches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All niches</SelectItem>
                {niches.map((n) => (
                  <SelectItem key={n} value={n} className="capitalize">{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name A-Z</SelectItem>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="niche">By niche</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {clients.length === 0 ? (
        <EmptyState title="No clients yet" description="Create your first client to get started" />
      ) : filteredClients.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No clients match your search</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => {
            const setupDone = isSetupComplete(client);
            return (
              <Link key={client._id} to={`/clients/${client._id}`}>
                <Card className="transition-shadow hover:shadow-md relative">
                  {!setupDone && (
                    <div className="absolute top-3 right-3">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 bg-amber-500/10 text-amber-500 text-[10px] font-medium px-2 py-0.5 rounded-full">
                              <AlertCircle className="h-3 w-3" />
                              Setup incomplete
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>Complete the brand kit and voice profile to generate better carousels</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle>{client.name}</CardTitle>
                    <CardDescription className="capitalize">{client.niche}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={client.brand_kit?.primary_color ? "default" : "outline"} className="text-[10px]">Brand</Badge>
                      <Badge variant={client.voice_profile?.raw_text ? "default" : "outline"} className="text-[10px]">Voice</Badge>
                      {client.ig_oauth?.ig_username && (
                        <Badge variant="secondary" className="text-[10px]">@{client.ig_oauth.ig_username}</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
