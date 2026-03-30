// ── Built-in style presets ─────────────────────────────────────
// These are style prompt templates that can be selected in the
// generation form. They include placeholder tokens like {{BRAND_NAME}}
// that get replaced with client data + content brief fields.

export interface ContentBrief {
  hook: string;
  problem: string;
  core_insight: string;
  the_shift: string;
  proof_points: string[];
  solution_items: string[];
  cta: string;
  topic: string;
}

export const EMPTY_CONTENT_BRIEF: ContentBrief = {
  hook: "",
  problem: "",
  core_insight: "",
  the_shift: "",
  proof_points: ["", "", "", ""],
  solution_items: ["", "", ""],
  cta: "",
  topic: "",
};

export interface BuiltInPreset {
  id: string;
  name: string;
  description: string;
  slideCount: number;
  hasContentBrief: true;
  buildPrompt: (brief: ContentBrief, brand: { name: string; handle: string; primaryColor: string }) => string;
}

// ── Coach Roddy MMA Style ──────────────────────────────────────

function buildCoachRoddyPrompt(
  brief: ContentBrief,
  brand: { name: string; handle: string; primaryColor: string },
): string {
  const proofRows = brief.proof_points
    .filter((p) => p.trim())
    .map((p, i) => `${i + 1}. ${p}`)
    .join("\n");

  const solutionRows = brief.solution_items
    .filter((s) => s.trim())
    .map((s, i) => `${String(i + 1).padStart(2, "0")} ${s}`)
    .join("\n");

  return `You are an Instagram carousel designer. Create a 7-slide carousel in the following exact style.

Brand Identity
Brand name: ${brand.name}
Instagram handle: ${brand.handle}
Primary color: ${brand.primaryColor}
Font: Bebas Neue for headlines, Barlow for body text (both from Google Fonts)
Tone: Raw, direct, authoritative. No corporate language. First person only.

Design System — follow exactly
Layout rule: Every slide uses the same structure:
Photo fills the full slide
Small logo lockup top-left (dot + name, always same position)
Text lives in a dark gradient band at the bottom only — never over faces
Progress bar bottom edge, every slide
Swipe arrow right edge, every slide except the last
Typography hierarchy — 3 levels only:
Eyebrow: 10px, Barlow, 700 weight, 3px letter spacing, uppercase, brand color
Headline: Bebas Neue, 46–58px, white, line height 0.92
Subtext: Barlow, 13–14px, rgba(255,255,255,0.5) — clearly subordinate
Rules:
Max 15 words per text block
One idea per slide
No paragraphs
Faces must always be fully visible — text never covers eyes
Headline must be 3× more dominant than subtext visually

Slide Structure — 7 slides using this exact narrative arc

Slide 1 — HOOK
Full bleed photo, faces visible in top half
Headline: outcome or bold claim (not the product name)
Subtext: one short supporting line
No badges or tags — just the hook
${brief.hook ? `Content direction: "${brief.hook}"` : ""}

Slide 2 — PROBLEM
Photo slide, text band bottom
Eyebrow: "The Problem"
Headline: pain point in 2–3 lines
Subtext: one specific line with a number or contrast
${brief.problem ? `Content direction: "${brief.problem}"` : ""}

Slide 3 — WHY IT HAPPENS
Dark solid background — no photo
This slide is ONE thing only: either a headline OR a quote, not both
If quote: use a giant decorative quotation mark as visual anchor (opacity 0.08, brand color, 220px)
Keep it short and punchy
${brief.core_insight ? `Content direction: "${brief.core_insight}"` : ""}

Slide 4 — THE SHIFT
Photo with strong dark overlay (rgba 0.72) — photo is texture, not hero
Show the core concept visually — not just in words
Use a visual contrast element: big numbers, a ratio, a split
${brief.the_shift ? `Content direction: "${brief.the_shift}"` : ""}

Slide 5 — PROOF
Portrait photo, subject positioned top-right
Directional overlay: darker left, lighter right (keeps face visible)
Eyebrow: "My Credentials" or "My Record"
3–4 proof rows only: large number + short label
Generous row spacing, no sub-descriptions
${proofRows ? `Proof points:\n${proofRows}` : ""}

Slide 6 — SOLUTION
Action photo, text band bottom
Eyebrow: "Inside ${brief.topic || "[product/offer]"}"
3 items only — no more
Highlight the most important item with a left brand-color bar accent
${solutionRows ? `Solution items:\n${solutionRows}` : ""}

Slide 7 — CTA
Dark solid background — clean, nothing competes
Faint watermark: product name in giant Bebas Neue, opacity 0.04
Tension line first (small, faded): a line about what they lose by not acting
Headline: short call to action
Subtext: one line of reinforcement
CTA button: brand color, Bebas Neue, 22px, full width feel
Handle: bottom, uppercase, very faded
${brief.cta ? `CTA direction: "${brief.cta}"` : ""}

${brief.topic ? `Topic / offer: ${brief.topic}` : ""}`;
}

export const COACH_RODDY_PRESET: BuiltInPreset = {
  id: "__builtin_coach_roddy",
  name: "Coach Roddy MMA",
  description: "Bold 7-slide narrative arc — Hook → Problem → Insight → Shift → Proof → Solution → CTA",
  slideCount: 7,
  hasContentBrief: true,
  buildPrompt: buildCoachRoddyPrompt,
};

export const BUILT_IN_PRESETS: BuiltInPreset[] = [COACH_RODDY_PRESET];
