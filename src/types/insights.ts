export interface TrackedPostAnalysis {
  hook_text: string;
  hook_style: string;
  cta_text: string;
  cta_style: string;
  content_theme: string;
  content_format: string;
  tone: string;
  slide_count: number;
  caption_length: number;
  hashtag_count: number;
}

export interface TrackedPost {
  _id: string;
  client_id: string;
  account_id: string;
  ig_url: string;
  ig_post_id: string | null;
  caption: string | null;
  likes: number | null;
  comments: number | null;
  posted_at: string | null;
  slide_count: number | null;
  analysis: TrackedPostAnalysis | null;
  status: "pending" | "processing" | "ready" | "failed";
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatternFrequency {
  value: string;
  count: number;
  avg_engagement: number;
}

export interface LearningInsight {
  insight: string;
  confidence: number;
  based_on_posts: number;
}

export interface ClientLearningProfile {
  _id: string;
  client_id: string;
  account_id: string;
  posts_analyzed: number;
  last_updated: string;
  hook_styles: PatternFrequency[];
  cta_styles: PatternFrequency[];
  content_themes: PatternFrequency[];
  content_formats: PatternFrequency[];
  tones: PatternFrequency[];
  avg_slide_count: number;
  avg_caption_length: number;
  avg_engagement_rate: number;
  best_posting_days: string[];
  best_posting_times: string[];
  insights: LearningInsight[];
  generation_prompt_summary: string;
  created_at: string;
  updated_at: string;
}
