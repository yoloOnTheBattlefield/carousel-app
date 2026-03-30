import { useState } from "react";
import { Card, CardContent } from "@quddify/ui/card";
import { Input } from "@quddify/ui/input";
import { Badge } from "@quddify/ui/badge";
import { Button } from "@quddify/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@quddify/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@quddify/ui/table";
import {
  Search,
  Eye,
  MessageCircle,
  Heart,
  Play,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useResearchPosts, useResearchCompetitors, useResearchKpis } from "@/hooks/useResearch";
import { EmptyState } from "@/components/shared/EmptyState";

function formatNumber(n: number | undefined | null): string {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "1d ago";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1mo ago" : `${months}mo ago`;
}

export default function ContentResearch() {
  const [search, setSearch] = useState("");
  const [competitor, setCompetitor] = useState("all");
  const [postType, setPostType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: kpis } = useResearchKpis();
  const { data: competitors = [] } = useResearchCompetitors();
  const { data: postsData, isLoading } = useResearchPosts({
    search: search || undefined,
    competitor: competitor !== "all" ? competitor : undefined,
    post_type: postType !== "all" ? postType : undefined,
    sort_by: sortBy,
    page,
    limit: 20,
  });

  const posts = postsData?.posts ?? [];
  const totalPages = postsData?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Content Research</h1>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Posts Tracked</p>
              <p className="text-2xl font-bold">{formatNumber(kpis.postsTracked)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Comments Analyzed</p>
              <p className="text-2xl font-bold">{formatNumber(kpis.commentsAnalyzed)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Unique Commenters</p>
              <p className="text-2xl font-bold">{formatNumber(kpis.uniqueCommenters)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Competitors</p>
              <p className="text-2xl font-bold">{competitors.length}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search captions or @handles..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={competitor}
          onValueChange={(v) => {
            if (v) {
              setCompetitor(v);
              setPage(1);
            }
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All competitors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All competitors</SelectItem>
            {competitors.map((c) => (
              <SelectItem key={c.handle} value={c.handle}>
                @{c.handle}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={postType}
          onValueChange={(v) => {
            if (v) {
              setPostType(v);
              setPage(1);
            }
          }}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="reel">Reels</SelectItem>
            <SelectItem value="post">Posts</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={sortBy}
          onValueChange={(v) => {
            if (v) {
              setSortBy(v);
              setPage(1);
            }
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="most_comments">Most comments</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Posts Table */}
      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">Loading...</div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={<Eye className="h-10 w-10" />}
          title="No posts found"
          description="Scraped reels and posts from competitors will appear here. Run a deep scrape in research mode to get started."
        />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Competitor</TableHead>
                  <TableHead>Caption</TableHead>
                  <TableHead className="w-[80px]">Type</TableHead>
                  <TableHead className="w-[90px] text-right">
                    <Heart className="ml-auto h-4 w-4" />
                  </TableHead>
                  <TableHead className="w-[90px] text-right">
                    <MessageCircle className="ml-auto h-4 w-4" />
                  </TableHead>
                  <TableHead className="w-[90px] text-right">
                    <Play className="ml-auto h-4 w-4" />
                  </TableHead>
                  <TableHead className="w-[90px]">Posted</TableHead>
                  <TableHead className="w-[40px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <>
                    <TableRow
                      key={post.id}
                      className="cursor-pointer"
                      onClick={() => setExpandedId(expandedId === post.id ? null : post.id)}
                    >
                      <TableCell className="font-medium">@{post.competitorHandle}</TableCell>
                      <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">
                        {post.caption.slice(0, 80)}
                        {post.caption.length > 80 ? "..." : ""}
                      </TableCell>
                      <TableCell>
                        <Badge variant={post.postType === "reel" ? "default" : "outline"}>
                          {post.postType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(post.likesCount)}</TableCell>
                      <TableCell className="text-right">{formatNumber(post.commentsCount)}</TableCell>
                      <TableCell className="text-right">{formatNumber(post.playsCount)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {post.postedAt ? timeAgo(post.postedAt) : "—"}
                      </TableCell>
                      <TableCell>
                        {expandedId === post.id ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                    </TableRow>
                    {expandedId === post.id && (
                      <TableRow key={`${post.id}-expanded`}>
                        <TableCell colSpan={8} className="bg-muted/50 p-4">
                          <div className="space-y-3">
                            <p className="whitespace-pre-wrap text-sm leading-relaxed">
                              {post.caption || "No caption"}
                            </p>
                            {post.reelUrl && (
                              <a
                                href={post.reelUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="h-3 w-3" />
                                View on Instagram
                              </a>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} ({postsData?.total} posts)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
