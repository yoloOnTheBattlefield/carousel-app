import { useParams } from "react-router-dom";
import { TrendingUp } from "lucide-react";
import { useTrackedPosts, useLearningProfile } from "@/hooks/usePostInsights";
import { AddPostsDialog } from "@/components/post-insights/AddPostsDialog";
import { TrackedPostCard } from "@/components/post-insights/TrackedPostCard";
import { LearningProfileCard } from "@/components/post-insights/LearningProfileCard";
import { EmptyState } from "@/components/shared/EmptyState";

export default function PostInsights() {
  const { id: clientId } = useParams<{ id: string }>();
  const { data: posts = [], isLoading: postsLoading } = useTrackedPosts(clientId);
  const { data: profile } = useLearningProfile(clientId);

  if (postsLoading) {
    return <div className="py-8 text-center text-muted-foreground">Loading...</div>;
  }

  const processingCount = posts.filter((p) => p.status === "pending" || p.status === "processing").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Post Insights</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Analyze past posts to learn what works and improve future carousels
          </p>
        </div>
        {clientId && <AddPostsDialog clientId={clientId} />}
      </div>

      {/* Learning Profile */}
      {profile && profile.posts_analyzed > 0 && clientId && (
        <LearningProfileCard profile={profile} clientId={clientId} />
      )}

      {/* Processing banner */}
      {processingCount > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {processingCount} post{processingCount !== 1 ? "s" : ""} being analyzed...
        </div>
      )}

      {/* Posts grid */}
      {posts.length === 0 ? (
        <EmptyState
          icon={<TrendingUp className="h-10 w-10" />}
          title="No posts tracked yet"
          description="Paste Instagram post URLs to analyze what's working and improve your carousels"
          action={clientId ? <AddPostsDialog clientId={clientId} /> : undefined}
        />
      ) : (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            Tracked Posts ({posts.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <TrackedPostCard key={post._id} post={post} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
