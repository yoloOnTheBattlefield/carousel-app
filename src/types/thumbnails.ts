export interface ThumbnailTemplate {
  _id: string;
  account_id: string | null;
  name: string;
  description: string;
  preview_key: string | null;
  is_system: boolean;
  created_at: string;
}

export interface ThumbnailConcept {
  label: string;
  description: string;
  prompt: string;
  output_key: string | null;
}

export interface ThumbnailIteration {
  label: string;
  feedback: string;
  output_key: string;
  created_at: string;
}

export interface ThumbnailJob {
  _id: string;
  client_id: string;
  account_id: string;
  status: "queued" | "generating" | "combining" | "completed" | "failed";
  current_step: string;
  progress: number;
  error: string | null;
  topic: string;
  headshot_image_id: string;
  template_id: string | null;
  reference_urls: string[];
  concepts: ThumbnailConcept[];
  comparison_key: string | null;
  example_count: number;
  iterations: ThumbnailIteration[];
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}
