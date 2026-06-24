# DB Console — Design & UX Review

Reviewed against live screenshots of `/`, `/relational`, `/nonrelational`.  
Scope: polish pass on a ~95% complete product. No redesign. Preserve existing identity.

---

## Summary

The core design is strong. Dark aesthetic, typography system, and diagram are genuinely premium. The main gaps are: (1) the homepage doesn't communicate what the product *does* before asking you to choose a track, (2) no progress system exists anywhere, (3) code blocks have no syntax highlighting despite being the primary content medium, and (4) the track pages have almost no interactive feedback (no transitions on nav items, no completion states, no reading indicators). These are fixable without changing the design language.

---

## Findings, Ranked by Impact

---

### 1. Homepage: Zero signal about what's inside the tracks

**Impact: High**

The hero headline ("Every backend is the same loop: read, write, repeat.") is clever but tells a developer nothing about *this product*. "DATABASE REFERENCE" in tiny all-caps at the top is the only descriptor. There is no indication that the tracks contain interactive playgrounds, structured lessons, or how many topics exist.

A developer landing here for the first time has to click into a track just to understand what they're getting. Stripe and Vercel solve this with a 2–3 line subheading and a brief "what's inside" row below the hero.

**Recommended fixes:**

- Add a one-line subheading below the headline: something like `"20 interactive lessons across PostgreSQL, MongoDB, and Redis — from basics to internals."` This takes 5 seconds to add and immediately sets expectations.
- Add a tight stat row between the hero and the divider: `20 lessons  ·  3 playgrounds  ·  Surface → Bedrock`. Monospace, muted color, same visual register as the existing status dots. No new components needed.
- On each track card, add lesson count: `"20 lessons across 3 tiers"`. The cards currently only have one-line descriptions. Lesson count is a concrete commitment signal that affects click-through.
- The cards are partially below the fold at typical laptop viewport heights. Add `scroll-margin` and consider making the first card's CTA more prominent.

---

### 2. No progress tracking anywhere

**Impact: High**

There is no way to know where you are. After closing the browser and returning, you start back at lesson 1 with no record of what you read. There are no completion checkmarks on sidebar nav items, no "X of 20" counter, no tier completion state. The strata bars in the sidebar show *which tier this is*, not *how far through the tier you are* — subtle but misleading.

This is the single biggest usability gap for a learning product. Linear, Raycast docs, and Prisma's learning path all solve this with localStorage-persisted completion state.

**Recommended fixes:**

- Store completed topic IDs in `localStorage` keyed by track: `{ relational: Set<string>, nonrelational: Set<string> }`.
- Add a subtle checkmark (✓) or filled dot on completed nav items. Use the existing `--track-color` at low opacity for incomplete, full opacity for complete.
- Replace the strata bars' current "which tier is this" behavior with actual per-tier completion percentage: `3/6 Surface complete`.
- Add a "Continue where you left off" link on the homepage cards once any progress exists. A single line below the CTA: `→ Resume: Indexes — what they actually do`. This is how Linear's "continue" patterns work.
- Show topic position in the eyebrow: `SURFACE · POSTGRES · 3 of 6` instead of just `SURFACE · POSTGRES`.

---

### 3. Code blocks have no syntax highlighting

**Impact: High**

Every topic page is built around code. The `pre.codeblock` blocks are plain monospace text in `--text` color with no token differentiation. SQL keywords (`SELECT`, `FROM`, `WHERE`), Redis commands (`SET`, `GET`, `EXPIRE`), and MongoDB operators (`$match`, `$group`) are visually identical to values and comments.

Stripe Docs, Prisma Docs, and Supabase all use syntax highlighting as baseline. It's not decoration — it's readability infrastructure for code-heavy content.

**Recommended fixes:**

- Add [Shiki](https://shiki.style/) or [highlight.js](https://highlightjs.org/) to the content rendering pipeline. Shiki is the modern choice (used by VitePress, Nuxt, Astro) — runs at build/render time, no runtime bundle cost. Since content is in `dangerouslySetInnerHTML`, pre-process the HTML strings in `data.ts` to wrap tokens in `<span>` tags, or switch the content rendering to a thin React component that syntax-highlights `<pre>` blocks.
- Minimum viable version: highlight SQL keywords in `--rel` (blue) and Redis commands in `--nrel` (green). Even 4–5 token classes transform code readability.
- Add a copy button on every `pre.codeblock` inside topic content, not just in the Setup view. The infrastructure exists (`CopyButton` component) — wire it up to code blocks.

---

### 4. Track page: almost no interactive feedback on navigation

**Impact: High**

Clicking a sidebar nav item instantly replaces the content with no transition. There is no animation on the active item change, no fade on content swap, no scrollbar position feedback. The `transition: border-color 0.15s ease` on the run button is the only transition in the entire track UI.

For comparison: Linear's sidebar has a 150ms slide on active item. Vercel docs content fades in at 100ms. These are small but they make navigation feel intentional rather than teleporting.

**Recommended fixes:**

- Add `transition: background 0.15s ease, border-left-color 0.15s ease` to `.navItem`. Currently the background color on `.navItemActive` switches instantly.
- Add a simple fade on content mount. Since `TopicView` re-renders on topic change, a CSS animation on `.content > *` via `@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }` with `animation: fadeIn 0.15s ease` is enough. No animation library needed.
- Add `transition: background 0.15s ease` to `.setupItem` (currently instant).
- The `.navBtn` (prev/next) color transition on hover is instant — add `transition: color 0.1s ease`.

---

### 5. Content area max-width inconsistency

**Impact: Medium**

The HTML prototype uses `max-width: 780px` on the content column. The Next.js implementation uses `padding: 48px 150px 120px` instead, which means on a 1400px+ monitor the paragraphs run very wide (no max-width cap). On a 900px viewport the 150px side padding leaves only ~320px of content width, which is cramped.

**Recommended fixes:**

- Replace `padding: 48px 150px 120px` with `padding: 48px 40px 120px; max-width: 860px`. This matches the design intent from the prototype, handles wide screens gracefully, and gives more breathing room on narrow screens.
- The responsive breakpoint at 860px currently changes to `32px 24px 100px 28px` (asymmetric left/right). Clean this up to `32px 24px 100px` once max-width is applied.

---

### 6. Homepage hero: purpose unclear at 3-second glance

**Impact: Medium**

The Request Lifecycle diagram is beautiful but abstract — it shows arrows between a client and a database, which is accurate but doesn't tell a developer *why they're here*. A first-time visitor sees an animated diagram and a poetic headline and has to scroll past it to understand this is a learning platform with interactive exercises.

Compare to Supabase's homepage, which puts `"Build in a weekend. Scale to millions."` with a code snippet visible in frame. The code is what tells you what the product does.

**Recommended fixes:**

- Add a small preview of what's inside the diagram panel or just below it. Even a single `SELECT * FROM plants WHERE sunlight = 'full sun';` in a mini code block inside the diagram area signals "interactive code is inside."
- Alternatively, add a micro-label to the diagram panel: `"Try it inside →"` — two words that tell a developer there's something to interact with.
- The `"DATABASE REFERENCE"` top label should be replaced with `"Interactive Learning Platform"` or similar — "reference" implies static docs, not interactive playgrounds.

---

### 7. No page titles or metadata per route

**Impact: Medium**

All three routes share the same `<title>DB Console</title>`. Browser tabs, bookmarks, and `⌘L` bar show no context about which page you're on.

**Recommended fixes:**

- Export `metadata` from each route's `page.tsx`:
  - `/`: `"DB Console — Learn PostgreSQL, MongoDB & Redis"`
  - `/relational`: `"Relational Track — DB Console"`
  - `/nonrelational`: `"Non-Relational Track — DB Console"`
- This is 3 lines of code per page file. Highest ROI fix in the list.

---

### 8. Playground: no Reset button, NrelPlayground missing disabled state

**Impact: Medium**

`SqlPlayground` has a `disabled` prop on the Run button during execution, which prevents double-runs. `NrelPlayground` does not — clicking Run twice runs the simulator twice (building on the previous state), which can produce confusing results like double-inserted documents in the MongoDB simulator.

There's also no way to reset the playground back to its preset. If a user writes a malformed query or inserts bad data, their only option is to refresh the page, which also wipes all other state.

**Recommended fixes:**

- Add `disabled` state to `NrelPlayground`'s Run button (trivial — already have the pattern in `SqlPlayground`).
- Add a "Reset" button next to Run that calls `setInput(preset)` and `setOutput('Output will appear here.')`. One button, ~5 lines. This is the most-requested feature in interactive coding environments.
- For the MongoDB simulator specifically: module-level `docStore` means inserting a document on one topic persists to the next topic's session. This matches the HTML prototype's behavior but should be documented in the hint text: `"State persists across lessons — reload to reset."` Currently the hint says "Simulated console — not a real instance" which doesn't mention state persistence.

---

### 9. Accessibility: missing ARIA labels and focus styles

**Impact: Medium**

- All `<button>` elements in `RelationalTrack` and `NonRelationalTrack` have no `aria-label` or `aria-current` attributes. The active nav item (`.navItemActive`) is not announced as selected to screen readers.
- The `CopyButton` doesn't communicate its target to screen readers.
- Focus styles rely entirely on browser defaults (usually a thin blue ring). On dark backgrounds these are often invisible.
- The sidebar has no `aria-label` on the `<aside>` element.
- The `<main>` content area has no `aria-label`.

**Recommended fixes:**

- Add `aria-current="page"` to the active nav item.
- Add `aria-label="Track navigation"` to `<aside>`.
- Add `aria-label="Lesson content"` to `<main>`.
- Add explicit focus styles to buttons: `.navItem:focus-visible { outline: 2px solid var(--track-color); outline-offset: 2px; }`. Apply globally via `globals.css`.
- Add `aria-label={`Copy ${label}`}` to `CopyButton` where label describes the content type.

---

### 10. Sidebar nav item text wraps excessively

**Impact: Medium**

At 280px sidebar width, topic titles like `"Constraints — rules the database enforces for you"` and `"What a relational database actually is"` wrap to 3 lines. This makes the sidebar visually heavy and hard to scan. The Midground and Bedrock tiers require significant scrolling.

**Recommended fixes:**

- Reduce font-size of nav items from `14.5px` to `13px`. This is within legibility range and brings most titles to 1–2 lines.
- Alternatively, truncate with `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` and show full title on hover via tooltip. This is the approach used by Linear and VS Code's sidebar.
- Consider shortening some titles in `data.ts` — `"Constraints — rules the database enforces for you"` → `"Constraints"` works in a sidebar context where the content area shows the full title.

---

### 11. No ⌘K command palette

**Impact: Low–Medium**

Search/command palette (⌘K) is now expected in any developer tool with more than ~10 items. With 37 total topics across two tracks, discoverability across tracks is zero — there's no way to jump from a MongoDB topic to a related SQL topic without navigating manually.

**Recommended fixes:**

- This is a real engineering investment. Defer unless it's a priority.
- If building it: `cmdk` library + a flat index of all topics from both `REL_TOPICS` and `NREL_TOPICS`. Wire ⌘K globally in `layout.tsx`. Each result navigates to `/relational#topic-id` or `/nonrelational#topic-id`.
- Minimum viable version: a simple modal with a text input that filters a flat list. No fuzzy matching needed. 150 lines of code.

---

### 12. Homepage: cards not fully visible at laptop viewport

**Impact: Low**

At 720px viewport height (common 13" laptop), the hero + divider already fills the screen. The track cards are partially visible — enough to know something is below, but the CTA text ("start with surface →") is cut off. Users who don't scroll miss the call to action entirely.

**Recommended fixes:**

- Reduce hero top padding from `72px` to `48px`.
- Reduce `margin-bottom` on `hero-divider` from `44px 0` to `28px 0`.
- These two changes bring the cards into viewport on most laptops without changing the composition.

---

### 13. No estimated reading time

**Impact: Low**

Topics vary from ~150 words (Replication) to ~400 words (N+1 queries). Showing `~2 min read` in the eyebrow sets expectations and reduces anxiety about committing to a lesson.

**Recommended fixes:**

- Calculate word count from `topic.html` by stripping tags: `html.replace(/<[^>]*>/g, '').split(/\s+/).length`.
- Display `~N min` in the eyebrow alongside tier label. One utility function, one render line.

---

### 14. Dark theme: a few contrast and separation notes

**Impact: Low**

The dark theme is well-executed. Minor observations:

- `--muted: #8A8F94` on `--bg: #0a0a0b` — contrast ratio is ~4.5:1, which passes AA for normal text but is tight. For the smallest text (11px eyebrow labels, nav tier names), this occasionally dips into borderline.
- The `--border: #262B30` on `--surface: #14171A` is nearly invisible on some monitors. The sidebar border-right and tier dividers can disappear on high-contrast displays. Consider `#2E333A` (+10% lightness) for borders that carry structural meaning.
- `callout` left border uses `--track-color` which correctly inherits green/blue. The body background of callouts is `--surface`, same as the sidebar — no visual separation from the sidebar context. Adding `background: var(--surface-2)` to callouts would lift them off the page.

---

## Quick Wins (< 30 min each)

These require minimal code and have high visible impact:

| Fix | File | Effort |
|-----|------|--------|
| Per-route `metadata` titles | `app/relational/page.tsx`, `app/nonrelational/page.tsx` | 5 min |
| Lesson position in eyebrow (`3 of 6`) | `RelationalTrack.tsx`, `NonRelationalTrack.tsx` | 10 min |
| `disabled` on NrelPlayground Run button | `NrelPlayground.tsx` | 5 min |
| Reset button in both playgrounds | `SqlPlayground.tsx`, `NrelPlayground.tsx` | 15 min |
| Homepage stat row (lesson count, playground count) | `app/page.tsx` | 20 min |
| `aria-current`, `aria-label` on nav | Track components | 15 min |
| Content `max-width: 860px` + reduced side padding | `track.module.css` | 5 min |
| Nav item transition (background, border-left) | `track.module.css` | 5 min |
| Copy button on topic `pre.codeblock` blocks | Track components + CSS | 20 min |
| `callout` background → `var(--surface-2)` | `track.module.css` | 2 min |

---

## Larger Investments (worth doing, but scope appropriately)

| Feature | Estimated Effort | Notes |
|---------|-----------------|-------|
| localStorage progress tracking | 2–3 hrs | Completion state per topic, "continue" link on homepage |
| Syntax highlighting (Shiki) | 3–4 hrs | Run at data-prep time, output pre-rendered HTML |
| Content fade transition | 30 min | CSS `@keyframes`, no library |
| ⌘K command palette | 4–6 hrs | `cmdk` library, flat topic index |
| Reading time estimates | 1 hr | Utility + render |

---

## What This App Does Right (preserve these)

- Typography system (Space Grotesk + Public Sans + JetBrains Mono) is excellent and consistent.
- Color tokens are disciplined — `--rel`/`--nrel` track colors via CSS custom properties is clean architecture.
- The Request Lifecycle diagram on the homepage is genuinely beautiful and unique.
- Sidebar tier structure (Surface → Midground → Bedrock) is a strong pedagogical scaffold.
- The strata progress bars are a nice visual motif — just repurpose them for actual completion state.
- `SqlPlayground` using real sql.js WASM (not a fake simulator) is a meaningful credibility signal — make it more visible.
- The HTML prototype's content is excellent. Tone, depth, and real-world examples (Plantarium, Prisma, Vercel deployment) are strong and should stay.
