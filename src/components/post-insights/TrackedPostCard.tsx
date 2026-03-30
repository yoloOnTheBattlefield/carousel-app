import { Card, CardContent, CardHeader, CardTitle } from "@quddify/ui/card";
import { Badge } from "@quddify/ui/badge";
import { Button } from "@quddify/ui/button";
import { ExternalLink, Heart, MessageCircle, RefreshCw, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useDeleteTrackedPost, useReanalyzePost } from "@/hooks/usePostInsights";
import type { TrackedPost } from "@/types";
import { toast } from "sonner";

interface TrackedPostCardProps {
  post: TrackedPost;
}

export function TrackedPostCard({ post }: TrackedPostCardProps) {
  const deletePost = useDeleteTrackedPost();
  const reanalyze = useReanalyzePost();

  const shortUrl = post.ig_url.replace(/^https?:\/\/(www\.)?instagram\.com/, "").slice(0, 30);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium truncate">
            <a
              href={post.ig_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:underline"
            >
              {shortUrl}...
              <ExternalLink className="h-3 w-3 flex-shrink-0" />
            </a>
          </CardTitle>
          <StatusBadge status={post.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Engagement metrics */}
        {(post.likes != null || post.comments != null) && (
          <div className="flex gap-3 text-xs text-muted-foreground">
            {post.likes != null && (
              <span className="inline-flex items-center gap-1">
                <Heart className="h-3 w-3" /> {post.likes.toLocaleString()}
              </span>
            )}
            {post.comments != null && (
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="h-3 w-3" /> {post.comments.toLocaleString()}
              </span>
            )}
            {post.slide_count != null && (
              <span>{post.slide_count} slides</span>
            )}
          </div>
        )}

        {/* Caption preview */}
        {post.caption && (
          <p className="text-xs text-muted-foreground line-clamp-2">{post.caption}</p>
        )}

        {/* Analysis results */}
        {post.analysis && (
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="text-[10px]">
              {post.analysis.hook_style.replace(/_/g, " ")}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {post.analysis.content_theme.replace(/_/g, " ")}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {post.analysis.cta_style.replace(/_/g, " ")}
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              {post.analysis.tone}
            </Badge>
          </div>
        )}

        {/* Error */}
        {post.status === "failed" && post.error && (
          <p className="text-xs text-destructive">{post.error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          {(post.status === "ready" || post.status === "failed") && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() =>
                reanalyze.mutate(post._id, {
                  onSuccess: () => toast.success("Re-analyzing post"),
                })
              }
              disabled={reanalyze.isPending}
            >
              <RefreshCw className="mr-1 h-3 w-3" /> Reanalyze
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-destructive hover:text-destructive"
            onClick={() =>
              deletePost.mutate(post._id, {
                onSuccess: () => toast.success("Post removed"),
              })
            }
            disabled={deletePost.isPending}
          >
            <Trash2 className="mr-1 h-3 w-3" /> Remove
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
