export interface BrandKit {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_heading: string;
  font_body: string;
  text_color_light: string;
  text_color_dark: string;
  logo_url: string | null;
  style_notes: string;
}

export interface VoiceProfile {
  raw_text: string;
}

export interface CtaDefaults {
  primary_cta: string;
  secondary_cta: string;
  cta_enabled: boolean;
  cta_image_id: string | null;
}

export interface IgOAuth {
  access_token: string | null;
  page_access_token: string | null;
  page_id: string | null;
  ig_user_id: string | null;
  ig_username: string | null;
  connected_at: string | null;
}

export interface AiIntegrations {
  claude_token: string | null;
  openai_token: string | null;
  gemini_token: string | null;
}

export interface Client {
  _id: string;
  account_id: string;
  user_id: string | null;
  name: string;
  slug: string;
  email: string | null;
  niche: string;
  sales_rep_name: string;
  brand_kit: BrandKit;
  voice_profile: VoiceProfile;
  cta_defaults: CtaDefaults;
  special_instructions: string;
  ig_username: string | null;
  ig_bio: string | null;
  ig_profile_picture_url: string | null;
  ig_oauth?: IgOAuth;
  ai_integrations?: AiIntegrations;
  google_drive_folder_id: string | null;
  google_drive_sync_token: string | null;
  face_reference_images: string[];
  created_at: string;
  updated_at: string;
}
