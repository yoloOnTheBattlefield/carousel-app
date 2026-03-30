export interface Insight {
  text: string;
  strength: number;
}

export interface Quote {
  text: string;
  speaker: string;
  strength: number;
}

export interface EmotionalPeak {
  text: string;
  emotion: string;
  intensity: number;
}

export interface TopicCluster {
  topic: string;
  excerpts: string[];
  strength: number;
}

export interface TranscriptExtracted {
  pain_points: Insight[];
  desires: Insight[];
  objections: Insight[];
  quotes: Quote[];
  story_moments: Array<{ text: string; emotional_weight: number }>;
  teaching_moments: Array<{ text: string; clarity: number }>;
  cta_opportunities: Array<{ text: string; fit: number }>;
  emotional_peaks: EmotionalPeak[];
  topic_clusters: TopicCluster[];
}

export interface Transcript {
  _id: string;
  client_id: string;
  account_id: string;
  title: string;
  raw_text: string;
  call_type: "sales_call" | "coaching_call" | "content_brainstorm" | "generic" | "custom";
  custom_tag: string | null;
  ai_model: "gpt-4o" | "gpt-4o-mini" | "claude-sonnet";
  extracted: TranscriptExtracted;
  overall_strength: number;
  status: "pending" | "processing" | "ready" | "failed";
  created_at: string;
  updated_at: string;
}

export interface SlideStructure {
  slide_number: number;
  type: string;
  text_placement: string;
  has_image: boolean;
}

export interface StyleProfile {
  style_name: string;
  hook_style: string;
  slide_count: number;
  text_density: "minimal" | "moderate" | "heavy";
  visual_style: string;
  layout_rhythm: string;
  cta_pattern: string;
  headline_format: string;
  color_mood: string;
  pacing: string;
  slide_structure: SlideStructure[];
}

export interface SwipeFile {
  _id: string;
  client_id: string | null;
  account_id: string;
  source_url: string | null;
  source_type: "own_post" | "competitor" | "inspiration";
  title: string;
  screenshot_keys: string[];
  style_profile: StyleProfile;
  engagement_score: number | null;
  reuse_count: number;
  status: "pending" | "processing" | "ready" | "failed";
  created_at: string;
  updated_at: string;
}

export interface ResearchPost {
  id: string;
  competitorHandle: string;
  caption: string;
  postType: "reel" | "post";
  commentsCount: number;
  likesCount: number;
  playsCount: number;
  postedAt: string;
  reelUrl: string;
}

export interface ResearchPostsResponse {
  posts: ResearchPost[];
  total: number;
  totalPages: number;
  page: number;
}

export interface ResearchCompetitor {
  handle: string;
  postsTracked: number;
  avgComments: number;
  lastPost: string;
}

export interface ResearchKpis {
  postsTracked: number;
  commentsAnalyzed: number;
  uniqueCommenters: number;
  newPostsSinceLogin: number;
}
