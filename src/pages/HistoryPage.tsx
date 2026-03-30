import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@quddify/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@quddify/ui/table";
import { Badge } from "@quddify/ui/badge";
import { Input } from "@quddify/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@quddify/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@quddify/ui/tooltip";
import { History, Search, RefreshCw, AlertCircle } from "lucide-react";
import { useCarousels } from "@/hooks/useCarousels";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfidenceBadge } from "@/components/carousel/ConfidenceBadge";
import { EmptyState } from "@/components/shared/EmptyState";

export default function HistoryPage() {
  const { id: clientId } = useParams<{ id: string }>();
  const { data: carousels = [], isLoading } = useCarousels(clientId);
  const [search, setSearch] = useState("");
  const [formatFilter, setFormatFilter] = useState("all");
  const [goalFilter, setGoalFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const goals = useMemo(() => [...new Set(carousels.map((c) => c.goal))], [carousels]);

  const filtered = useMemo(() => {
    return carousels.filter((c) => {
      if (formatFilter !== "all" && (c.content_type || "carousel") !== formatFilter) return false;
      if (goalFilter !== "all" && c.goal !== goalFilter) return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!c.goal.toLowerCase().includes(s) && !c.status.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [carousels, formatFilter, goalFilter, statusFilter, search]);

  if (isLoading) return <div className="py-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Content History</h1>
        {carousels.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-40 pl-8 text-xs"
              />
            </div>
            <Select value={formatFilter} onValueChange={setFormatFilter}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue placeholder="All formats" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All formats</SelectItem>
                <SelectItem value="carousel">Carousels</SelectItem>
                <SelectItem value="story">Stories</SelectItem>
              </SelectContent>
            </Select>
            {goals.length > 1 && (
              <Select value={goalFilter} onValueChange={setGoalFilter}>
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue placeholder="All goals" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All goals</SelectItem>
                  {goals.map((g) => (
                    <SelectItem key={g} value={g} className="capitalize">{g.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-28 text-xs">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="generating">Generating</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {carousels.length === 0 ? (
        <EmptyState
          icon={<History className="h-10 w-10" />}
          title="No carousels generated yet"
          description="Generate your first carousel to see it here"
        />
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No carousels match your filters</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Goal</TableHead>
                  <TableHead>Slides</TableHead>
                  <TableHead>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help border-b border-dashed border-muted-foreground/40">Confidence</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>AI confidence score (0-100). 70+ is strong, 40-69 is average, below 40 needs review.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c._id}>
                    <TableCell className="text-sm">{new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs capitalize">{c.content_type === "story" ? "Story" : "Carousel"}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className="text-xs capitalize">{c.goal.replace(/_/g, " ")}</Badge></TableCell>
                    <TableCell>{c.slides.length}</TableCell>
                    <TableCell><ConfidenceBadge score={c.confidence.overall} /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={c.status} />
                        {c.status === "failed" && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertCircle className="h-3.5 w-3.5 text-destructive cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>Click "View" to see the error details and regenerate</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link to={`/clients/${clientId}/carousels/${c._id}`} className="text-sm font-medium text-primary hover:underline">
                          View
                        </Link>
                        {c.status === "ready" && (
                          <Link
                            to={`/clients/${clientId}/generate`}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                            title="Generate a similar carousel"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Link>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
