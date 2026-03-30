// ── Built-in style presets ─────────────────────────────────────
// These are style prompt templates that can be selected in the
// generation form. They include placeholder tokens that get
// replaced with client data + content brief fields.

export interface ContentBrief {
  topic: string;
  hook: string;
  problem: string;
  solution: string;
  features: string[];
  details: string;
  steps: string[];
  cta: string;
}

export const EMPTY_CONTENT_BRIEF: ContentBrief = {
  topic: "",
  hook: "",
  problem: "",
  solution: "",
  features: ["", "", "", ""],
  details: "",
  steps: ["", "", ""],
  cta: "",
};

export interface BuiltInPreset {
  id: string;
  name: string;
  description: string;
  slideCount: number;
  hasContentBrief: true;
  buildPrompt: (brief: ContentBrief, brand: { name: string; handle: string; primaryColor: string }) => string;
}

// ── Instagram Carousel Design System ────────────────────────

function buildDesignSystemPrompt(
  brief: ContentBrief,
  brand: { name: string; handle: string; primaryColor: string },
): string {
  const featureRows = brief.features
    .filter((f) => f.trim())
    .map((f, i) => `${i + 1}. ${f}`)
    .join("\n");

  const stepRows = brief.steps
    .filter((s) => s.trim())
    .map((s, i) => `${String(i + 1).padStart(2, "0")}. ${s}`)
    .join("\n");

  return `You are an Instagram carousel design system. Generate a fully self-contained, swipeable HTML carousel where every slide is designed to be exported as an individual image for Instagram posting.

Brand Identity
Brand name: ${brand.name}
Instagram handle: ${brand.handle}
Primary brand color: ${brand.primaryColor}

---

Color System — Derive from primary color

From the primary brand color, generate a full 6-token palette:

BRAND_PRIMARY   = ${brand.primaryColor}                         // Main accent — progress bar, icons, tags
BRAND_LIGHT     = primary lightened ~20%            // Secondary accent — tags on dark, pills
BRAND_DARK      = primary darkened ~30%             // CTA text, gradient anchor
LIGHT_BG        = warm or cool off-white            // Light slide background (never pure #fff)
LIGHT_BORDER    = slightly darker than LIGHT_BG     // Dividers on light slides
DARK_BG         = near-black with brand tint        // Dark slide background

Rules for deriving colors:
- LIGHT_BG should be a tinted off-white that complements the primary (warm primary → warm cream, cool primary → cool gray-white)
- DARK_BG should be near-black with a subtle tint matching the brand temperature (warm → #1A1918, cool → #0F172A)
- LIGHT_BORDER is always ~1 shade darker than LIGHT_BG
- The brand gradient used on gradient slides is: linear-gradient(165deg, BRAND_DARK 0%, BRAND_PRIMARY 50%, BRAND_LIGHT 100%)

---

Typography

Pick a heading font and body font from Google Fonts that suit the brand tone. Suggested pairings:
- Editorial / premium: Playfair Display + DM Sans
- Modern / clean: Plus Jakarta Sans (700) + Plus Jakarta Sans (400)
- Warm / approachable: Lora + Nunito Sans
- Technical / sharp: Space Grotesk + Space Grotesk
- Bold / expressive: Fraunces + Outfit
- Classic / trustworthy: Libre Baskerville + Work Sans
- Rounded / friendly: Bricolage Grotesque + Bricolage Grotesque

Font size scale (fixed):
- Headings: 28–34px, weight 600, letter-spacing -0.3 to -0.5px, line-height 1.1–1.15
- Body: 14px, weight 400, line-height 1.5–1.55
- Tags/labels: 10px, weight 600, letter-spacing 2px, uppercase
- Step numbers: heading font, 26px, weight 300
- Small text: 11–12px

Apply via CSS classes .serif (heading font) and .sans (body font) throughout all slides.

---

Slide Architecture

Format:
- Aspect ratio: 4:5 (Instagram carousel standard)
- Each slide is self-contained — all UI elements baked into the image
- Alternate LIGHT_BG and DARK_BG backgrounds for visual rhythm

Required Elements Embedded In Every Slide:

1. Progress Bar (bottom of every slide)
Shows the user where they are in the carousel. Fills up as they swipe.
- Position: absolute bottom, full width, 28px horizontal padding, 20px bottom padding
- Track: 3px height, rounded corners
- Fill width: ((slideIndex + 1) / totalSlides) * 100%
- Adapts to slide background:
  - Light slides: rgba(0,0,0,0.08) track, BRAND_PRIMARY fill, rgba(0,0,0,0.3) counter
  - Dark slides: rgba(255,255,255,0.12) track, #fff fill, rgba(255,255,255,0.4) counter
- Counter label beside the bar: "1/7" format, 11px, weight 500

2. Swipe Arrow (right edge — every slide EXCEPT the last)
A subtle chevron on the right edge telling the user to keep swiping. On the last slide it is removed so the user knows they've reached the end.
- Position: absolute right, full height, 48px wide
- Background: gradient fade from transparent → subtle tint
- Chevron: 24×24 SVG, rounded strokes
- Adapts to slide background:
  - Light slides: rgba(0,0,0,0.06) bg, rgba(0,0,0,0.25) stroke
  - Dark slides: rgba(255,255,255,0.08) bg, rgba(255,255,255,0.35) stroke

---

Slide Content Patterns

Layout rules:
- Content padding: 0 36px standard
- Bottom-aligned slides with progress bar: 0 36px 52px to clear the bar
- Hero/CTA slides: justify-content: center
- Content-heavy slides: justify-content: flex-end (text at bottom, visual breathing room above)

Tag / Category Label:
Small uppercase label above the heading on each slide to categorize the content.
- Light slides: color = BRAND_PRIMARY
- Dark slides: color = BRAND_LIGHT
- Brand gradient slides: color = rgba(255,255,255,0.6)

Logo Lockup (first and last slides):
Brand icon + brand name displayed together.
- Use first letter of brand name in 40px circle (BRAND_PRIMARY bg) with white letter, brand name beside it
- Brand name: 13px, weight 600, letter-spacing 0.5px

---

Reusable Components

Strikethrough pills (for "what's being replaced" messaging on problem slides):
<span style="font-size:11px;padding:5px 12px;border:1px solid rgba(255,255,255,0.1);border-radius:20px;color:#6B6560;text-decoration:line-through;">{Old tool}</span>

Tag pills (for feature labels, options, or categories):
<span style="font-size:11px;padding:5px 12px;background:rgba(255,255,255,0.06);border-radius:20px;color:{BRAND_LIGHT};">{Label}</span>

Prompt / quote box (for showing example inputs, quotes, or testimonials):
<div style="padding:16px;background:rgba(0,0,0,0.15);border-radius:12px;border:1px solid rgba(255,255,255,0.08);">
  <p class="sans" style="font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:6px;">{Label}</p>
  <p class="serif" style="font-size:15px;color:#fff;font-style:italic;line-height:1.4;">"{Quote text}"</p>
</div>

Feature list (icon + label + description rows):
<div style="display:flex;align-items:flex-start;gap:14px;padding:10px 0;border-bottom:1px solid {LIGHT_BORDER};">
  <span style="color:{BRAND_PRIMARY};font-size:15px;width:18px;text-align:center;">{icon}</span>
  <div>
    <span class="sans" style="font-size:14px;font-weight:600;color:{DARK_BG};">{Label}</span>
    <span class="sans" style="font-size:12px;color:#8A8580;">{Description}</span>
  </div>
</div>

Numbered steps:
<div style="display:flex;align-items:flex-start;gap:16px;padding:14px 0;border-bottom:1px solid {LIGHT_BORDER};">
  <span class="serif" style="font-size:26px;font-weight:300;color:{BRAND_PRIMARY};min-width:34px;line-height:1;">01</span>
  <div>
    <span class="sans" style="font-size:14px;font-weight:600;color:{DARK_BG};">{Step title}</span>
    <span class="sans" style="font-size:12px;color:#8A8580;">{Step description}</span>
  </div>
</div>

CTA button (final slide only):
<div style="display:inline-flex;align-items:center;gap:8px;padding:12px 28px;background:{LIGHT_BG};color:{BRAND_DARK};font-family:'{BODY_FONT}',sans-serif;font-weight:600;font-size:14px;border-radius:28px;">
  {CTA text}
</div>

---

Standard Slide Sequence — 7 slides using this narrative arc

Slide 1 — HERO (LIGHT_BG)
Hook — bold statement, logo lockup
Start with a hook — must stop the scroll. Lead with a value proposition or bold claim, not a description.
${brief.hook ? `Content direction: "${brief.hook}"` : ""}

Slide 2 — PROBLEM (DARK_BG)
Pain point — what's broken, frustrating, or outdated
${brief.problem ? `Content direction: "${brief.problem}"` : ""}

Slide 3 — SOLUTION (Brand gradient)
The answer — what solves it, optional quote/prompt box
${brief.solution ? `Content direction: "${brief.solution}"` : ""}

Slide 4 — FEATURES (LIGHT_BG)
What you get — feature list with icons
${featureRows ? `Features to include:\n${featureRows}` : ""}

Slide 5 — DETAILS (DARK_BG)
Depth — customization, specs, differentiators
${brief.details ? `Content direction: "${brief.details}"` : ""}

Slide 6 — HOW-TO (LIGHT_BG)
Steps — numbered workflow or process
${stepRows ? `Steps to include:\n${stepRows}` : ""}

Slide 7 — CTA (Brand gradient)
Call to action — logo, tagline, CTA button. No swipe arrow. Full progress bar at 100%.
${brief.cta ? `CTA direction: "${brief.cta}"` : ""}

Rules:
- Start with a hook — the first slide must stop the scroll
- End with a CTA on brand gradient — no swipe arrow, progress bar at 100%
- Alternate light and dark backgrounds for visual rhythm
- Adapt the sequence to the topic — not every carousel needs a "problem" slide
- Slides can be reordered, added, or removed based on what the content needs

${brief.topic ? `Topic / offer: ${brief.topic}` : ""}

---

Instagram Frame (Preview Wrapper)

Wrap the carousel in an Instagram-style frame for preview:
- Header: Avatar (BRAND_PRIMARY circle + first letter) + handle + subtitle
- Viewport: 4:5 aspect ratio, swipeable/draggable track with all slides
- Dots: Small dot indicators below the viewport
- Actions: Heart, comment, share, bookmark SVG icons
- Caption: Handle + short carousel description + "2 HOURS AGO" timestamp

Include pointer-based swipe/drag interaction for the preview.

Important: The .ig-frame must be exactly 420px wide. The carousel viewport inside it has a 4:5 aspect ratio (420×525px). All slide layouts, font sizes, and spacing are designed for this 420px base width.

---

Design Principles

1. Every slide is export-ready — arrow and progress bar are part of the slide image, not overlay UI
2. Light/dark alternation — creates visual rhythm and sustains attention across swipes
3. Heading + body font pairing — display font for impact, body font for readability
4. Brand-derived palette — all colors stem from one primary, keeping everything cohesive
5. Progressive disclosure — progress bar fills and arrow guides the user forward
6. Last slide is special — no arrow (signals end), full progress bar, clear CTA
7. Consistent components — same tag style, same list style, same spacing across all slides
8. Content padding clears UI — body text never overlaps with the progress bar or arrow`;
}

export const DESIGN_SYSTEM_PRESET: BuiltInPreset = {
  id: "__builtin_design_system",
  name: "Instagram Design System",
  description: "Full design system — alternating light/dark slides, color palette, progress bar, swipe arrows, reusable components",
  slideCount: 7,
  hasContentBrief: true,
  buildPrompt: buildDesignSystemPrompt,
};

export const BUILT_IN_PRESETS: BuiltInPreset[] = [DESIGN_SYSTEM_PRESET];
