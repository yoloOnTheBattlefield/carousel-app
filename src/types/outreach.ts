export type CTAMechanism =
  | "comment_keyword"
  | "link_in_bio"
  | "dm_trigger"
  | "custom"
  | "uncertain";

export interface ProspectCTA {
  mechanism: CTAMechanism;
  detected_cta: string;
  confidence: number;
  evidence: string[];
}

export interface InferredBrand {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  style_notes?: string;
}

export interface TopPerformingAngle {
  angle: string;
  engagement_rate: number;
}

export interface ProspectProfileData {
  name: string;
  niche: string;
  offer: string;
  audience: string;
  core_message: string;
  voice_notes: string;
  content_angles: string[];
  cta_style: ProspectCTA;
  top_performing_angles: TopPerformingAngle[];
}

export type ProspectStatus = "scraping" | "profiling" | "ready" | "expired" | "failed";

export interface ScrapedPost {
  url: string;
  image_urls: string[];
  caption: string;
  likes: number;
  comments: number;
  timestamp: string;
  type: "image" | "carousel" | "reel";
}

export interface ScrapedReel {
  url: string;
  video_url: string;
  thumbnail_url: string;
  caption: string;
  likes: number;
  comments: number;
  views: number;
  timestamp: string;
  transcript: string;
}

export interface ProspectProfile {
  _id: string;
  account_id: string;
  client_id: string;
  ig_handle: string;
  ig_bio: string;
  ig_profile_picture_url: string;
  ig_followers_count: number;
  status: ProspectStatus;
  current_step: string;
  progress: number;
  error?: string;
  scraped_posts: ScrapedPost[];
  scraped_reels: ScrapedReel[];
  profile: ProspectProfileData;
  inferred_brand: InferredBrand;
  image_ids: string[];
  generation_time_ms: number | null;
  scrape_started_at: string;
  expires_at: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScrapeRequest {
  ig_handle: string;
  client_id: string;
  direct_urls?: string[];
}

export interface OutreachGenerateRequest {
  topic?: string;
  goal?: "saveable_educational" | "polarizing_authority" | "emotional_story" | "conversion_focused";
  slide_count?: number;
  additional_instructions?: string;
}

export interface UpdateProfileRequest {
  profile?: Partial<Omit<ProspectProfileData, "cta_style"> & { cta_style?: Partial<ProspectCTA> }>;
  inferred_brand?: Partial<InferredBrand>;
}
