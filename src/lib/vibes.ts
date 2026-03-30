import type { CarouselGoal, LayoutPreset } from "@/types";

export interface Vibe {
  id: string;
  name: string;
  description: string;
  emoji: string;
  goal: CarouselGoal;
  slideCount: number;
  layoutPreset: LayoutPreset;
  builtInPresetId?: string;
}

export const VIBES: Vibe[] = [
  {
    id: "clean_minimal",
    name: "Clean & Minimal",
    description: "White space, crisp typography, elegant simplicity",
    emoji: "✨",
    goal: "saveable_educational",
    slideCount: 7,
    layoutPreset: { mode: "ai_suggested" },
    builtInPresetId: "__builtin_design_system",
  },
  {
    id: "bold_authority",
    name: "Bold Authority",
    description: "Dark backgrounds, strong contrasts, commanding presence",
    emoji: "🎯",
    goal: "polarizing_authority",
    slideCount: 7,
    layoutPreset: { mode: "ai_suggested" },
    builtInPresetId: "__builtin_design_system",
  },
  {
    id: "editorial_premium",
    name: "Editorial Premium",
    description: "Magazine-quality layouts, serif fonts, refined aesthetic",
    emoji: "📰",
    goal: "saveable_educational",
    slideCount: 7,
    layoutPreset: { mode: "ai_suggested" },
    builtInPresetId: "__builtin_design_system",
  },
  {
    id: "gradient_pop",
    name: "Gradient Pop",
    description: "Vibrant gradients, energetic colors, eye-catching slides",
    emoji: "🌈",
    goal: "conversion_focused",
    slideCount: 7,
    layoutPreset: { mode: "ai_suggested" },
    builtInPresetId: "__builtin_design_system",
  },
  {
    id: "warm_organic",
    name: "Warm & Organic",
    description: "Earthy tones, soft textures, approachable and human",
    emoji: "🍂",
    goal: "emotional_story",
    slideCount: 7,
    layoutPreset: { mode: "ai_suggested" },
    builtInPresetId: "__builtin_design_system",
  },
  {
    id: "story_driven",
    name: "Story-Driven",
    description: "Narrative arc, emotional hooks, transformation journey",
    emoji: "🎬",
    goal: "emotional_story",
    slideCount: 7,
    layoutPreset: { mode: "ai_suggested" },
    builtInPresetId: "__builtin_design_system",
  },
  {
    id: "tech_sharp",
    name: "Tech Sharp",
    description: "Monospace accents, dark UI feel, modern and technical",
    emoji: "⚡",
    goal: "saveable_educational",
    slideCount: 7,
    layoutPreset: { mode: "ai_suggested" },
    builtInPresetId: "__builtin_design_system",
  },
  {
    id: "conversion_machine",
    name: "Conversion Machine",
    description: "Problem-agitate-solve, strong CTAs, DM-optimized",
    emoji: "🚀",
    goal: "conversion_focused",
    slideCount: 5,
    layoutPreset: { mode: "ai_suggested" },
    builtInPresetId: "__builtin_design_system",
  },
];
