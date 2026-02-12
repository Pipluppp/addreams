# Addreams — Design System & Aesthetic Guide

## Design Soul

the reference aesthetic is **neo-editorial minimalism with sculptural typography**. not swiss-grid corporate. not startup gradient slop. it's closer to an indie magazine layout that happens to be interactive — bold type floating in generous negative space, bordered containers used as compositional devices rather than UI chrome, and a single punch of saturated color that makes the whole thing feel alive.

the vibe is: a well-curated gallery opening, not a SaaS dashboard.

for addreams, we adapt this into something slightly more **kinetic and production-forward** — we're a creative tool, not an events board. the calm confidence stays, but we inject a sense of *generative energy* — the feeling that something is always being made.

---

## Core Principles

### 1. Radical Whitespace
- space is the primary design material. content floats in it.
- never fill a section bc it "feels empty." emptiness IS the design.
- minimum 80px+ vertical rhythm between major sections.
- the page should breathe like a lookbook, not stack like a feed.

### 2. Contained Typography
- large display text lives inside **thin-bordered rectangular containers** — not as cards, but as *frames*. think: museum plaques, specimen labels, editorial pull-quotes.
- borders are 1px solid, black or near-black. no rounded corners on rectangular frames (rounded is reserved for the accent element — see below).
- frames can overlap, offset, or cascade. they're compositional, not gridlocked.
- this framing device is the signature motif. use it for headlines, key stats, feature labels, CTA anchors.

### 3. The Pink Accent — One Color, Maximum Impact
- **brand color**: `#FF4FC2` (hot magenta-pink) — or nearby on the spectrum. vibrant, not pastel. not fuchsia-red, not bubblegum. think: highlighter on newsprint.
- used ONLY for:
  - one primary CTA or hero keyword (pill-shaped, rounded container — this is the ONE rounded element)
  - hover states on interactive elements
  - active/selected states
  - occasional accent badges or tags
- everything else is black, near-black, and cream. the pink earns its power through scarcity.

### 4. Warm Neutral Canvas
- background is NOT pure white. it's **cream / warm off-white**: `#FAF8F5` or `#F7F4EF`.
- this warmth is subtle but critical — it's what makes the aesthetic feel curated rather than clinical.
- cards or elevated surfaces can use pure white `#FFFFFF` to create gentle depth against the cream.

### 5. Typography as Architecture
- **display / headlines**: a bold, high-contrast serif OR geometric sans with strong character. think: editorial weight. candidates: `Instrument Serif`, `Fraunces`, `Clash Display`, `Satoshi`, `Cabinet Grotesk`. pick ONE display face and commit.
- **body / UI**: a clean humanist sans. `General Sans`, `Satoshi`, `Switzer`, `Plus Jakarta Sans`. legible, warm, not sterile.
- display sizes should be LARGE — 48px minimum for hero, scaling up to 72-96px on desktop. the type IS the visual.
- letter-spacing: tight on display (-0.02em to -0.04em), normal on body.
- mixing weights within a headline (e.g., light + bold in the same line) adds dynamism.

---

## Layout System

### Spatial Composition
- **asymmetric grid**: not a rigid 12-col bootstrap grid. use CSS grid with intentional asymmetry — 60/40 splits, off-center hero text, elements that break column boundaries.
- **offset containers**: bordered text frames should overlap or offset from each other slightly, creating depth through arrangement rather than shadows.
- **scroll-driven reveals**: sections appear with subtle translate-y + opacity transitions on scroll. no bounce, no overshoot. ease-out, 400-600ms.

### Navigation
- minimal top bar. logo left, 2-3 text links, CTA button.
- nav links are uppercase, small, letterspaced (`0.08em`+). understated until hovered.
- mobile: hamburger is fine but keep it minimal — a simple line icon, not a boxed button.

### The Sticker / Badge Element
- the reference uses a circular rotating badge (the "BROWSE" seal). for addreams, adapt this as a **floating generative badge** — a circular element with rotating text or a subtle animation that signals "AI-powered" or "generating."
- use sparingly. one per page max. it's a punctuation mark, not a pattern.

---

## Component Patterns

### Hero Section
```
┌─────────────────┐  ╭──────────────╮
│  Generate       │  │   ads  ●     │  ← pink pill, rounded
└─────────────────┘  ╰──────────────╯
      ┌──────────┐ ┌───────────┐
      │  that     │ │  convert  │
      └──────────┘ └───────────┘
```
- large framed words arranged in a staggered / cascading grid
- one keyword in the pink pill
- subtitle below in normal body text, no frame

### Feature Cards
- white surface on cream background
- thin 1px border, no border-radius (or 2px max)
- generous internal padding (32-48px)
- feature title in display font, description in body
- on hover: border color transitions to pink, or a subtle pink wash appears

### CTA Buttons
- **primary**: pink background (`#FF4FC2`), white text, pill-shaped (full border-radius). bold but not huge.
- **secondary**: transparent with 1px black border, rectangular (no radius). text is black.
- **ghost**: text-only with underline on hover.

### Gallery / Output Previews
- generated images shown in a masonry or asymmetric grid
- thin black border frames around each image (maintaining the specimen-label motif)
- hover: slight scale (1.02) + shadow lift
- optional: a small bordered label overlaid showing the generation style/mode

### Form Inputs
- minimal: bottom-border-only or thin full-border
- no heavy box shadows, no rounded inputs
- placeholder text in a lighter warm gray
- focus state: border transitions to pink

### Workflow Selector (Ad Graphics / Product Shoots / Video Shoots)
- tab-like interface using the bordered-container motif
- selected tab gets pink fill (pill shape) or pink underline
- unselected tabs are bordered rectangles, neutral

---

## Color Tokens

```css
:root {
  /* canvas */
  --bg-primary: #FAF8F5;        /* warm cream */
  --bg-surface: #FFFFFF;         /* cards, elevated */
  --bg-surface-hover: #FFF5FB;   /* subtle pink wash on hover */

  /* text */
  --text-primary: #1A1A1A;       /* near-black */
  --text-secondary: #6B6560;     /* warm gray */
  --text-tertiary: #A39E98;      /* muted, placeholders */

  /* accent */
  --accent-pink: #FF4FC2;        /* THE color */
  --accent-pink-hover: #E8389F;  /* darker on press */
  --accent-pink-light: #FFF0F9;  /* tinted backgrounds */

  /* borders */
  --border-primary: #1A1A1A;     /* frames, containers */
  --border-subtle: #E5E0DA;      /* dividers, soft lines */

  /* semantic */
  --success: #2D9F6F;
  --error: #D94545;
  --warning: #E5A03A;
}
```

---

## Motion & Interaction

### Principles
- motion is **quiet and confident**. no jelly bounces, no particle effects.
- default easing: `cubic-bezier(0.25, 0.1, 0.25, 1)` — smooth ease-out.
- durations: 200ms for micro (hover, focus), 400-600ms for macro (section reveals, page transitions).

### Key Animations
- **hero load**: framed words stagger in with slight translate-y (20px) + opacity. 100ms delay between each. the pink pill arrives last with a subtle scale-up (0.95 → 1).
- **scroll reveals**: sections fade up. no horizontal slides.
- **hover on bordered containers**: border color transitions to pink. maybe a 1px translate on the frame for a slight "lift."
- **generation in progress**: a subtle shimmer or scan-line effect on the output area. NOT a spinner — something that feels like *creation happening*.
- **rotating badge**: continuous slow rotation (20-30s per revolution) via CSS animation.

---

## Iconography
- line icons, 1.5px stroke, matching `--text-primary`.
- source: lucide, phosphor, or custom SVG.
- no filled icons except in active/selected states.
- icons are supporting cast, never the star. if you need an icon to explain something, the copy isn't good enough.

---

## Photography & Generated Content Display
- generated images are the PRODUCT — give them pride of place.
- always framed (thin border) when displayed in-app.
- before/after comparisons: side-by-side in offset bordered frames.
- empty states: don't show sad-face illustrations. show a bordered frame with a subtle animated gradient inside (the "canvas waiting to be filled" motif).

---

## Dark Mode (Future)
when we do dark mode:
- canvas: `#121210` (warm near-black, not blue-black)
- surface: `#1E1E1C`
- borders: `#3A3835`
- pink accent stays the same — it'll pop even harder
- text inverts to `#F5F2ED`

---

## Anti-Patterns — Do NOT

- ❌ gradient backgrounds (especially purple/blue)
- ❌ rounded corners on everything (only the pink pill gets radius)
- ❌ drop shadows as a crutch for depth (use border + offset instead)
- ❌ generic sans-serif (Inter, Roboto, system-ui)
- ❌ illustrations in a "flat corporate" style
- ❌ centered-everything layouts (use asymmetry)
- ❌ rainbow color palettes (one accent only)
- ❌ skeleton loaders (use the shimmer-canvas motif instead)
- ❌ cookie-cutter SaaS hero with screenshot-in-browser-frame
- ❌ "trusted by" logo bars in the hero (we're MVP, be real)

---

## TL;DR

cream canvas. black type in thin-bordered frames. one hot pink accent used like a highlighter. big editorial typography. asymmetric layout. generous space. quiet motion. the aesthetic says: "we're a creative tool that respects craft." not "we're another AI wrapper with a landing page template."