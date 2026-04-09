// --- Slide (matches backend CarouselSlideSchema) ---

export type SlideComposition =
  | "single_hero"
  | "split_collage"
  | "grid_2x2"
  | "before_after"
  | "lifestyle_grid"
  | "text_only";

export interface CarouselSlide {
  position: number;
  role: string;
  composition: SlideComposition;
  copy: string;
  copy_why: string;
  image_id: string | null;
  image_key: string;
  extra_image_keys: string[];
  extra_image_ids: string[];
  is_ai_generated_image: boolean;
  rendered_key: string;
  rendered_url?: string;
  image_selection_reason: string;
}

// --- Carousel ---

export type CarouselGoal =
  | "saveable_educational"
  | "polarizing_authority"
  | "emotional_story"
  | "conversion_focused";

export type CarouselStatus = "queued" | "generating" | "ready" | "failed";

export interface CarouselConfidence {
  overall: number;
  explanation: string;
}

export interface CarouselAngle {
  chosen_angle: string;
  angle_type: string;
  supporting_excerpts: string[];
  hook_options: string[];
  why_this_angle: string;
}

export interface Carousel {
  _id: string;
  client_id: string;
  account_id: string;
  topic: string;
  goal: CarouselGoal;
  slides: CarouselSlide[];
  caption: string;
  hashtags: string[];
  confidence: CarouselConfidence;
  angle: CarouselAngle;
  strategy_notes: string;
  status: CarouselStatus;
  generation_log: string[];
  created_at: string;
  updated_at: string;
}

// --- Job ---

export interface CarouselJob {
  _id: string;
  carousel_id: string;
  account_id: string;
  status: string;
  current_step: string;
  progress: number;
  error: string | null;
  created_at: string;
}

// --- Generate request ---

export interface GenerateRequest {
  client_id: string;
  topic: string;
  goal?: CarouselGoal;
  slide_count?: number;
  additional_instructions?: string;
  show_brand_name?: boolean;
}

// --- Chat edit ---

export interface ChatEditResponse {
  carousel: Carousel;
  updated_slides: Array<{ position: number; copy: string }>;
  swapped_images?: Array<{ position: number; image_id: string; reason?: string }>;
  assistant_message: string;
}
