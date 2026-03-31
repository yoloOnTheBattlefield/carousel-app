export interface ImageTags {
  emotion: string[];
  context: string[];
  body_language: string[];
  facial_expression: string[];
  setting: string[];
  clothing: string[];
  activity: string[];
  vibe: string[];
  lighting: string[];
  color_palette: string[];
  composition: string[];
}

export interface TextSafeZones {
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
}

export interface ClientImage {
  _id: string;
  client_id: string;
  account_id: string;
  storage_key: string;
  thumbnail_key: string | null;
  original_filename: string;
  mime_type: string;
  width: number;
  height: number;
  file_size: number;
  tags: ImageTags;
  quality_score: number;
  face_visibility_score: number;
  energy_level: number;
  text_safe_zones: TextSafeZones;
  subject_position: string;
  aspect_ratio: number;
  is_portrait: boolean;
  suitable_as_cover: boolean;
  is_ai_generated: boolean;
  total_uses: number;
  last_used_at: string | null;
  used_in_carousels: string[];
  status: "processing" | "ready" | "failed" | "archived";
  source: "google_drive" | "manual_upload" | "ai_generated";
  manual_tags: string[];
  summary: string;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientLut {
  _id: string;
  client_id: string;
  account_id: string;
  name: string;
  storage_key: string;
  original_filename: string;
  format: "cube" | "3dl";
  size: number;
  file_size: number;
  preview_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface LutData {
  name: string;
  size: number;
  data: number[];
}
