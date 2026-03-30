export interface SlideTemplate {
  position: number;
  role: string;
  copy_instruction: string;
  tone_note: string | null;
}

export interface CarouselTemplate {
  _id: string;
  account_id: string;
  client_id: string | null;
  name: string;
  type: "content_structure" | "visual" | "reference_derived";
  source_swipe_file_id: string | null;
  content_structure: {
    slide_count: number;
    slides: SlideTemplate[];
    hook_formula: string | null;
    cta_formula: string | null;
  };
  visual_structure: {
    background_style: string;
    text_position: string;
    text_style: {
      size: string;
      weight: string;
      case: string;
      alignment: string;
    };
    image_treatment: string;
    overlay_opacity: number;
    accent_elements: string[];
  };
  layout_preset?: LayoutPreset;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export type SlideComposition = "single_hero" | "split_collage" | "grid_2x2" | "before_after" | "lifestyle_grid" | "text_only";

export type LayoutPresetMode = "uniform" | "sequence" | "ai_suggested";

export interface LayoutPresetSequenceItem {
  position: number;
  composition: SlideComposition;
}

export interface LayoutPreset {
  mode: LayoutPresetMode;
  default_composition?: SlideComposition;
  sequence?: LayoutPresetSequenceItem[];
}

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
  image_selection_reason: string;
}

export interface ConfidenceScore {
  overall: number;
  transcript_strength: number;
  hook_strength: number;
  image_copy_fit: number;
  brand_fit: number;
  style_fit: number;
  image_quality_avg: number;
  ai_image_ratio: number;
  cta_fit: number;
  save_potential: number;
  dm_potential: number;
  explanation: string;
}

export type CarouselGoal = "saveable_educational" | "polarizing_authority" | "emotional_story" | "conversion_focused";

export type ContentType = "carousel" | "story";

export type CarouselStatus = "queued" | "generating" | "ready" | "failed" | "scheduled" | "published" | "archived";

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
  content_type: ContentType;
  transcript_ids: string[];
  swipe_file_id: string | null;
  template_id: string | null;
  lut_id: string | null;
  layout_preset?: LayoutPreset;
  goal: CarouselGoal;
  slides: CarouselSlide[];
  caption: string;
  hashtags: string[];
  angle: CarouselAngle;
  strategy_notes: string;
  confidence: ConfidenceScore;
  status: CarouselStatus;
  generation_log: string[];
  exported_at: string | null;
  scheduled_date: string | null;
  posted_to_ig: boolean;
  ig_post_id: string | null;
  ig_posted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CarouselJob {
  _id: string;
  carousel_id: string;
  account_id: string;
  status: string;
  current_step: string;
  progress: number;
  error: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}
