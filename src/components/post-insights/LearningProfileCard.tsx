import { Card, CardContent, CardHeader, CardTitle } from "@quddify/ui/card";
import { Badge } from "@quddify/ui/badge";
import { Button } from "@quddify/ui/button";
import { Brain, RefreshCw, Lightbulb } from "lucide-react";
import { useRebuildLearningProfile } from "@/hooks/usePostInsights";
import type { ClientLearningProfile, PatternFrequency } from "@/types";
import { toast } from "sonner";

interface LearningProfileCardProps {
  profile: ClientLearningProfile;
  clientId: string;
}

function TopPatterns({ label, patterns }: { label: string; patterns: PatternFrequency[] }) {
  if (patterns.length === 0) return null;
  const top = patterns.slice(0, 3);
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {top.map((p) => (
          <Badge key={p.value} variant="outline" className="text-[10px]">
            {p.value.replace(/_/g, " ")} ({p.count})
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function LearningProfileCard({ profile, clientId }: LearningProfileCardProps) {
  const rebuild = useRebuildLearningProfile();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Learning Profile</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {profile.posts_analyzed} post{profile.posts_analyzed !== 1 ? "s" : ""} analyzed
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() =>
                rebuild.mutate(clientId, {
                  onSuccess: () => toast.success("Profile rebuilt"),
                })
              }
              disabled={rebuild.isPending}
            >
              <RefreshCw className={`mr-1 h-3 w-3 ${rebuild.isPending ? "animate-spin" : ""}`} />
              Rebuild
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-lg font-bold">{profile.avg_slide_count.toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground">Avg Slides</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">{profile.avg_engagement_rate.toFixed(1)}%</p>
            <p className="text-[10px] text-muted-foreground">Avg Engagement</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">{profile.avg_caption_length}</p>
            <p className="text-[10px] text-muted-foreground">Avg Caption Len</p>
          </div>
        </div>

        {/* Top patterns */}
        <div className="space-y-3">
          <TopPatterns label="Top Hook Styles" patterns={profile.hook_styles} />
          <TopPatterns label="Top CTA Styles" patterns={profile.cta_styles} />
          <TopPatterns label="Top Themes" patterns={profile.content_themes} />
          <TopPatterns label="Top Formats" patterns={profile.content_formats} />
          <TopPatterns label="Tone" patterns={profile.tones} />
        </div>

        {/* AI insights */}
        {profile.insights.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">AI Insights</p>
            <div className="space-y-2">
              {profile.insights.map((insight, i) => (
                <div key={i} className="flex gap-2 text-xs">
                  <Lightbulb className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-amber-500" />
                  <div>
                    <p>{insight.insight}</p>
                    <p className="text-muted-foreground text-[10px] mt-0.5">
                      Based on {insight.based_on_posts} posts | {Math.round(insight.confidence * 100)}% confidence
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generation summary preview */}
        {profile.generation_prompt_summary && (
          <div className="rounded-md bg-muted/50 p-3">
            <p className="text-[10px] font-medium text-muted-foreground mb-1">Generation Summary</p>
            <p className="text-xs leading-relaxed">{profile.generation_prompt_summary}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
