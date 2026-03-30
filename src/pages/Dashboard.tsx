import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@quddify/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@quddify/ui/table";
import { Badge } from "@quddify/ui/badge";
import { Input } from "@quddify/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@quddify/ui/select";
import {
  Users, Sparkles, CheckCircle, Clock, TrendingUp, Search,
  AlertTriangle, Images, FileText, ArrowRight, Upload, Plus,
} from "lucide-react";
import { useDashboardOverview } from "@/hooks/useDashboard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfidenceBadge } from "@/components/carousel/ConfidenceBadge";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Dashboard() {
  const { data, isLoading } = useDashboardOverview();
  const [carouselSearch, setCarouselSearch] = useState("");
  const [clientFilter, setClientFilter] = useState("all");

  if (isLoading || !data) {
    return <DashboardSkeleton />;
  }

  const { totals, clients, recent_carousels } = data;

  // Filter recent carousels
  const filteredCarousels = recent_carousels.filter((c) => {
    if (clientFilter !== "all" && c.client_id !== clientFilter) return false;
    if (carouselSearch && !c.client_name.toLowerCase().includes(carouselSearch.toLowerCase()) && !c.goal.toLowerCase().includes(carouselSearch.toLowerCase())) return false;
    return true;
  });

  // Get unique client names for filter dropdown
  const carouselClients = [...new Map(recent_carousels.map((c) => [c.client_id, c.client_name])).entries()];

  // Actionable insights
  const readyToPublish = recent_carousels.filter((c) => c.status === "ready").length;
  const failedCarousels = recent_carousels.filter((c) => c.status === "failed").length;
  const clientsWithoutImages = clients.filter((c) => c.total_images === 0);
  const clientsWithoutTranscripts = clients.filter((c) => c.total_transcripts === 0);
  const incompleteSetup = clients.filter((c) => !c.has_brand_kit || !c.has_voice_profile);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Agency Dashboard</h1>
        <Link
          to="/onboard"
          className="flex items-center gap-2 bg-[#c9a84c] text-black font-semibold px-4 py-2 rounded-xl text-[13px] hover:bg-[#d4b55a] transition-colors"
        >
          <Plus className="h-4 w-4" /> New Client
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.clients}</div>
            <p className="text-xs text-muted-foreground mt-1">Active accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Carousels</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.carousels}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totals.ready_carousels} ready, {totals.carousels - totals.ready_carousels - totals.pending_carousels} other
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ready</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{totals.ready_carousels}</span>
              {totals.carousels > 0 && (
                <span className="text-xs text-emerald-500 flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" />
                  {Math.round((totals.ready_carousels / totals.carousels) * 100)}%
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Success rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.pending_carousels}</div>
            {totals.pending_carousels === 0 ? (
              <Link to="/clients" className="text-xs text-primary hover:underline mt-1 inline-block">
                Generate one now &rarr;
              </Link>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">Currently generating</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Items */}
      {(readyToPublish > 0 || failedCarousels > 0 || incompleteSetup.length > 0 || clientsWithoutImages.length > 0 || clientsWithoutTranscripts.length > 0) && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {readyToPublish > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-emerald-400">{readyToPublish} carousel{readyToPublish !== 1 ? "s" : ""} ready to publish</p>
                <p className="text-[11px] text-[#555]">Review and schedule or post to Instagram</p>
              </div>
              <ArrowRight className="h-4 w-4 text-emerald-400/50 shrink-0" />
            </div>
          )}
          {failedCarousels > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-[#e84057]/20 bg-[#e84057]/5 px-4 py-3">
              <div className="w-8 h-8 rounded-lg bg-[#e84057]/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-4 w-4 text-[#e84057]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[#e84057]">{failedCarousels} failed generation{failedCarousels !== 1 ? "s" : ""}</p>
                <p className="text-[11px] text-[#555]">Check errors and retry</p>
              </div>
            </div>
          )}
          {clientsWithoutImages.length > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-[#c9a84c]/20 bg-[#c9a84c]/5 px-4 py-3">
              <div className="w-8 h-8 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center shrink-0">
                <Images className="h-4 w-4 text-[#c9a84c]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[#c9a84c]">{clientsWithoutImages.length} client{clientsWithoutImages.length !== 1 ? "s" : ""} need images</p>
                <p className="text-[11px] text-[#555] truncate">{clientsWithoutImages.map((c) => c.name).join(", ")}</p>
              </div>
              {clientsWithoutImages.length === 1 && (
                <Link to={`/clients/${clientsWithoutImages[0]._id}/images`} className="shrink-0">
                  <Upload className="h-4 w-4 text-[#c9a84c]/50 hover:text-[#c9a84c] transition-colors" />
                </Link>
              )}
            </div>
          )}
          {clientsWithoutTranscripts.length > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-[#c9a84c]/20 bg-[#c9a84c]/5 px-4 py-3">
              <div className="w-8 h-8 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center shrink-0">
                <FileText className="h-4 w-4 text-[#c9a84c]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[#c9a84c]">{clientsWithoutTranscripts.length} client{clientsWithoutTranscripts.length !== 1 ? "s" : ""} need transcripts</p>
                <p className="text-[11px] text-[#555] truncate">{clientsWithoutTranscripts.map((c) => c.name).join(", ")}</p>
              </div>
            </div>
          )}
          {incompleteSetup.length > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-[#222] bg-[#111] px-4 py-3">
              <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] flex items-center justify-center shrink-0">
                <Users className="h-4 w-4 text-[#555]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[#888]">{incompleteSetup.length} client{incompleteSetup.length !== 1 ? "s" : ""} incomplete setup</p>
                <p className="text-[11px] text-[#555] truncate">{incompleteSetup.map((c) => c.name).join(", ")}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* All Clients */}
      <Card>
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground mb-2">No clients yet</p>
              <Link to="/onboard" className="text-sm text-primary hover:underline">
                Add your first client &rarr;
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Niche</TableHead>
                  <TableHead className="text-center">Images</TableHead>
                  <TableHead className="text-center">Transcripts</TableHead>
                  <TableHead className="text-center">Carousels</TableHead>
                  <TableHead className="text-center">Avg Confidence</TableHead>
                  <TableHead className="text-center">Setup</TableHead>
                  <TableHead>Last Carousel</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((c) => (
                  <TableRow key={c._id}>
                    <TableCell>
                      <Link to={`/clients/${c._id}`} className="font-medium hover:underline">
                        {c.name}
                      </Link>
                    </TableCell>
                    <TableCell className="capitalize text-muted-foreground">{c.niche}</TableCell>
                    <TableCell className="text-center">
                      {c.total_images === 0 ? (
                        <Link to={`/clients/${c._id}/images`} className="text-[#c9a84c] text-xs hover:underline">Upload</Link>
                      ) : (
                        c.total_images
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {c.total_transcripts === 0 ? (
                        <Link to={`/clients/${c._id}/transcripts`} className="text-[#c9a84c] text-xs hover:underline">Add</Link>
                      ) : (
                        c.total_transcripts
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span>{c.ready_carousels}</span>
                      {c.pending_carousels > 0 && (
                        <span className="ml-1 text-xs text-muted-foreground">+{c.pending_carousels} pending</span>
                      )}
                      {c.failed_carousels > 0 && (
                        <span className="ml-1 text-xs text-destructive">({c.failed_carousels} failed)</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {c.avg_confidence !== null ? <ConfidenceBadge score={c.avg_confidence} /> : <span className="text-muted-foreground">&mdash;</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        <Badge variant={c.has_brand_kit ? "default" : "outline"} className="text-[10px]">Brand</Badge>
                        <Badge variant={c.has_voice_profile ? "default" : "outline"} className="text-[10px]">Voice</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{timeAgo(c.last_carousel_date)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Carousels with filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Carousels</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={carouselSearch}
                  onChange={(e) => setCarouselSearch(e.target.value)}
                  className="h-8 w-[150px] pl-8 text-xs"
                />
              </div>
              {carouselClients.length > 1 && (
                <Select value={clientFilter} onValueChange={setClientFilter}>
                  <SelectTrigger className="h-8 w-[140px] text-xs">
                    <SelectValue placeholder="All clients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All clients</SelectItem>
                    {carouselClients.map(([id, name]) => (
                      <SelectItem key={id} value={id}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {recent_carousels.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground mb-2">No carousels generated yet</p>
              <Link to="/clients" className="text-sm text-primary hover:underline">
                Pick a client and generate &rarr;
              </Link>
            </div>
          ) : filteredCarousels.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No carousels match your filters</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Goal</TableHead>
                  <TableHead className="text-center">Slides</TableHead>
                  <TableHead className="text-center">Confidence</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCarousels.map((c) => (
                  <TableRow key={c._id}>
                    <TableCell>
                      <Link to={`/clients/${c.client_id}`} className="hover:underline">
                        {c.client_name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(c.created_at)}</TableCell>
                    <TableCell className="capitalize">{c.goal.replace(/_/g, " ")}</TableCell>
                    <TableCell className="text-center">{c.slides_count}</TableCell>
                    <TableCell className="text-center"><ConfidenceBadge score={c.confidence} /></TableCell>
                    <TableCell><StatusBadge status={c.status} /></TableCell>
                    <TableCell>
                      {c.status === "ready" && (
                        <Link
                          to={`/clients/${c.client_id}/carousels/${c._id}`}
                          className="text-[11px] text-[#c9a84c] hover:underline"
                        >
                          View &rarr;
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
