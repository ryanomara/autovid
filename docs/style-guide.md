# AutoVid Style Guide

## Satori Graphics-Inspired Professional Motion Design

This style guide applies Satori Graphics' professional design principles to motion graphics and video production in AutoVid.

---

## 1. Visual Hierarchy

### The Hierarchy Pyramid

1. **Primary** — Main headline (largest, boldest, most contrast)
2. **Secondary** — Subheadlines or key points
3. **Tertiary** — Supporting details, captions

### Implementation Rules

- **Scale ratio**: Secondary = 60-70% of primary, Tertiary = 40-50%
- **Position hierarchy**: Primary at optical center or top third; secondary below
- **Contrast**: Primary should be 2-3x darker/lighter than background
- **Isolation**: Each hierarchy level should have breathing room (minimum 1 line height)

---

## 2. Contrast & Visual Gravity

### Creating Attention Through Contrast

- **Color contrast**: Light text on dark background (or vice versa)
- **Size contrast**: Make primary elements 2-3x larger than secondary
- **Weight contrast**: Bold headlines, lighter body text

### Visual Gravity Techniques

- Use **scale** to pull attention (larger = closer = more important)
- Use **motion** to direct gaze (movement draws the eye)
- Use **color hotspots** sparingly (maximum 1-2 accent colors per scene)

---

## 3. Alignment & Grid Systems

### Scene Alignment

- All elements should align to a consistent grid
- Left-aligned text creates stability and professionalism
- Center-aligned works for single focal points

### The M-Width Margin System

- **Safe frame**: Keep all critical content within margins equal to capital "M" width of the main headline font
- **This ensures text doesn't clip on different display sizes**

---

## 4. Repetition & Consistency

### Establishing Visual Rhythm

- Repeat **colors** throughout the video (brand palette)
- Repeat **typography** hierarchy (same fonts, consistent sizes)
- Repeat **animation timing** (similar duration for similar actions)
- Repeat **layout patterns** (similar scene structures)

### The 3-Repetition Rule

Any design element should appear **minimum 3 times** to establish a pattern:

- 3 slides with similar structure = recognizable format
- 3 color uses = brand recognition
- 3 animation timings = predictable rhythm

---

## 5. Movement & Flow

### The Eye-Path Principle

Design the path the viewer's eye should follow:

1. **Entry point** — Where does the eye enter the frame?
2. **Primary focus** — Main message/headline
3. **Secondary stops** — Supporting information
4. **Exit point** — Where does the eye leave?

### Animation Timing Principles

| Animation Type  | Duration   | Easing       |
| --------------- | ---------- | ------------ |
| Text fade in    | 400-600ms  | easeOut      |
| Slide in        | 600-800ms  | easeOutCubic |
| Scale up        | 500-700ms  | easeOutBack  |
| Full transition | 800-1200ms | easeInOut    |

---

## 6. Balance & Tension

### Types of Balance

- **Symmetrical**: Mirror-image balance (formal, stable)
- **Asymmetrical**: Different elements, equal visual weight (dynamic)
- **Radial**: Elements radiating from center

### Scene Composition Guidelines

- **Rule of thirds**: Place key elements at intersection points
- **Golden ratio**: Use 1.618:1 proportions for visual appeal
- **Optical center**: Slightly above mathematical center (for natural balance)

---

## 7. Negative Space

### The Power of Empty Space

- **Separates** related elements
- **Highlights** important content
- **Creates** breathing room for readability
- **Adds** sophistication and elegance

### Minimum Spacing Rules

- Headline to subhead: 0.5-1 line height
- Between list items: 1 line height
- Edge margins: M-width minimum
- Text to visual elements: minimum 0.5 line height

---

## 8. Typography Guidelines

### Font Selection Principles

- **Headlines**: Bold, clear, impact font (Arial Bold, Helvetica Neue Bold)
- **Body**: Clean, readable sans-serif (Arial, Roboto, Open Sans)
- **Avoid**: More than 2 fonts per video

### Type Scale (Based on 1080p)

| Level   | Size     | Weight   | Use Case        |
| ------- | -------- | -------- | --------------- |
| Display | 96-120px | Bold     | Main titles     |
| H1      | 72-84px  | Bold     | Scene titles    |
| H2      | 48-56px  | SemiBold | Section headers |
| Body    | 32-40px  | Regular  | Captions, lists |
| Small   | 24-28px  | Regular  | Footnotes       |

### Text Animation Best Practices

- **Entrance**: Fade + slight Y offset (10-20px)
- **Emphasis**: Scale pulse (1.0 → 1.05 → 1.0)
- **Exit**: Fade out, no movement (avoids awkward transitions)

### 8.1 Glyph-Safe Typography Rule (Hard Constraint)

Use this rule to prevent punctuation clipping artifacts in generated videos.

- Avoid bracket glyphs in large display text (`fontSize >= 56`) unless absolutely required:
  - Avoid: `(...)`, `[...]`, `{...}`
  - Prefer: `-`, `:`, or words (`to`, `vs`, `from`)
- Never start or end a headline with bracket glyphs.
- If brackets are required for correctness, keep them in body-sized text and not in title/closing slides.
- Keep rendered text bounds away from edges:
  - minimum horizontal envelope: `>= 0.6 * fontSize`
  - minimum vertical envelope: `>= 0.4 * fontSize`

---

## 9. Color Systems

### Building a Video Palette

1. **Background**: 1 color (dominant)
2. **Primary text**: 1 color (high contrast to background)
3. **Accent**: 1-2 colors (maximum, for emphasis)
4. **Secondary**: 1-2 colors (for supporting elements)

### Color Temperature

- **Warm colors**: Energy, excitement, urgency
- **Cool colors**: Trust, calm, professionalism
- **Neutral**: Balance, sophistication

### 9.1 Swatch Mapping Rules (Agent Constraint)

When a swatch is provided, agents must map colors by role and keep role assignment stable across the full video.

- **Role mapping**:
  - `primary`: dominant background or dominant headline color
  - `secondary`: supporting blocks, panels, and non-critical accents
  - `accent`: CTA, highlight, key moments only
  - `positive`: gains, recoveries, bullish values
  - `negative`: losses, drawdowns, bearish values
  - `neutral`: axes, grid, baselines, scaffolding UI
- **Do not role-swap mid-video**: once a swatch is mapped to a role, keep that mapping in every scene.
- **Do not invent extra colors** when a swatch is provided unless explicitly required for contrast safety.

### 9.2 Swatch Contrast Checks

- Headline/body text against background: minimum contrast target `4.5:1`.
- Large display text and chart annotations: minimum contrast target `3:1`.
- If contrast is borderline, use `textStroke` instead of introducing arbitrary new colors.

### 9.3 Swatch Consistency for Finance Scenes

- Keep semantic consistency:
  - Uptrend always uses the same positive swatch family.
  - Drawdown always uses the same negative swatch family.
  - Peak/highlight uses one fixed accent family.
- Keep chart infrastructure neutral (axis/grid/ticks) and avoid competing saturation.
- Keep scene-to-scene palette drift low; only accent intensity should vary with narrative focus.

---

## 10. Motion Design Principles

### The 12 Principles of Animation (Disney + Satori)

1. **Squash & Stretch** — Add weight and flexibility
2. **Anticipation** — Prepare viewer for action
3. **Staging** — Present idea clearly
4. **Follow Through & Overlapping** — Natural deceleration
5. **Slow In & Slow Out** — Natural acceleration/deceleration (easing)
6. **Arc** — Natural movement paths (avoid straight lines for organic motion)
7. **Secondary Action** — Supporting movement
8. **Timing** — Speed affects perception
9. **Exaggeration** — Push beyond reality for clarity
10. **Appeal** — Make elements attractive and relatable

---

## 11. Scene Composition Templates

### Title Slide

```
┌─────────────────────────────────┐
│                                 │
│         MAIN HEADLINE           │ ← H1, center, 1/3 down
│                                 │
│      Subtitle / tagline         │ ← Body, center
│                                 │
│   ┌───┐  ┌───┐  ┌───┐          │
│   │ ● │  │ ● │  │ ● │          │ ← Visual accent
│   └───┘  └───┘  └───┘          │
│                                 │
└─────────────────────────────────┘
```

### Content Slide

```
┌─────────────────────────────────┐
│ HEADLINE              [Accent]  │ ← Left-aligned H1
├─────────────────────────────────┤
│ ┌─────┐  ┌─────┐  ┌─────┐      │
│ │  ●  │  │  ●  │  │  ●  │      │
│ └─────┘  └─────┘  └─────┘      │
│  Item 1    Item 2    Item 3     │
└─────────────────────────────────┘
```

### Call to Action

```
┌─────────────────────────────────┐
│         BIG HEADLINE            │ ← H1, center, bold
│    Compelling subtext           │ ← Body, centered
│      [BUTTON / CTA]             │ ← Accent color
└─────────────────────────────────┘
```

---

## 12. Safe Boundaries Checklist

### Pre-Render Verification

- [ ] All text inside M-width margins
- [ ] No text partially clipped off-screen
- [ ] Secondary text aligned to primary
- [ ] Scene transitions smooth (800-1200ms)
- [ ] Typography hierarchy consistent
- [ ] Color palette limited to 4 colors max
- [ ] Animation timing consistent across scenes
- [ ] Visual flow guides eye correctly

### Motion-Specific Checks

- [ ] No text moves faster than eye can track (min 400ms)
- [ ] Slide-in animations end within safe margin
- [ ] Scale animations don't cause layout shift
- [ ] Opacity fades complete before scene change

---

## 13. Agent Guardrails (Must Follow)

These rules codify common failure modes seen in generated scenes. Agents should treat these as hard constraints, not suggestions.

### 13.1 Text Collision Rules

- Never place two text layers whose bounding boxes overlap at the same time.
- If two text layers are both center-aligned, enforce minimum vertical gap of `1.2 * max(lineHeightA, lineHeightB)`.
- If using stacked headings, keep `H1` and `H2` on separate baseline bands; do not animate both through the same Y range in the same 600ms window.
- Do not animate incoming text through occupied label regions (chart labels, KPI values, legends).
- Prefer staggered reveals for dense information (`200ms` to `350ms` offset per line).

### 13.1.1 Text Lifecycle Rules (Hard Constraint)

- Every text layer must have an explicit lifecycle phase: `enter`, `hold`, `exit`.
- Enter and exit windows must not overlap another active text layer in the same layout band.
- If replacing headline text, use handoff timing:
  - Old text reaches opacity `0` before new text exceeds opacity `0.35`.
  - Recommended handoff gap: `80ms` to `200ms`.
- For KPI scenes, reserve fixed text lanes (top, mid, bottom) and keep each lane single-owner at any timestamp.
- Do not stack two center-aligned text blocks with overlapping Y ranges, even if one is fading.

### 13.1.2 Text Occupancy Map (Required for Dense Scenes)

- Before authoring animations, define 3-6 horizontal occupancy bands.
- Assign each text layer to one band and keep it there for the scene unless it exits first.
- If a layer must move bands, exit fully, then re-enter in the new band.

### 13.2 Text Safety Envelope

- Keep all text anchors inside the M-width margin envelope.
- For animated text, validate both start and end positions against safe envelope.
- For center-aligned text, reserve full rendered width before placing neighboring blocks.
- For right-aligned numbers, align by right edge, not center, to avoid value jitter.

### 13.2.1 Layering and Overlap Policy (Hard Constraint)

- Use explicit `zIndex` for deterministic stacking. Do not rely on incidental array order.
- Recommended z-index bands:
  - Background/plates: `0-99`
  - Charts/images/video content: `100-399`
  - Labels/callouts/annotations: `400-799`
  - Titles, headers, critical UI text: `900+`
- Title and closing headline layers must use `zIndex >= 900`.
- Default text overlap policy is `overlapMode: "avoid-text"`.
- Use `overlapMode: "avoid-all"` only when text must avoid all occupied regions.
- Use `overlapMode: "label"` or `"effect"` only for intentional overlap use-cases.
- Text-on-text overlap is forbidden unless the layer is explicitly marked as `overlapMode: "effect"`.

### 13.3 Chart Construction Rules

- Always draw axis first, then grid, then data marks, then labels.
- Use dedicated layers for each line segment/bar; avoid one oversized shape that crosses unrelated regions.
- Keep chart labels outside plotted geometry when possible.
- Enforce minimum spacing:
  - Bars: `>= 40px` horizontal gap
  - Line points: `>= 120px` horizontal gap
  - Label to mark: `>= 20px`
- Use consistent stroke thickness per chart (`6px` to `10px` equivalent shapes).
- Avoid extreme rotation angles for pseudo-lines; split into shorter segments when angle exceeds about `35` degrees.

### 13.3.1 Financial Line Chart Precision

- Build line charts from ordered points, not from one long rotated rectangle.
- Maximum one segment per adjacent point pair.
- Use deterministic X spacing from timeline/index; do not eyeball point placement.
- Quantize Y values from a shared scale:
  - `y = chartBottom - ((value - minValue) / (maxValue - minValue)) * chartHeight`
- Pin all labels to the exact anchor point they describe (point-centered or offset with fixed delta).
- If visual jitter appears, round positions consistently (`Math.round`) for all points and labels.

### 13.3.2 Bar Chart Precision

- All bars in one chart must share identical width.
- Bar baseline must be identical across the series.
- Encode value only through height (not width/opacity drift).
- Label each bar below baseline; numeric value above bar top with fixed offset.

### 13.3.3 Chart QA Checks (Required)

- [ ] No crossing labels in chart area.
- [ ] No line segment passing through unrelated labels.
- [ ] Peaks and drawdowns visually align with annotated values.
- [ ] Axis, grid, marks, and labels are separable at a glance.

### 13.4 Financial Chart Readability

- Maximum one primary metric label per quadrant.
- Keep value labels short (`$13`, `$118.75`, `-92.5%`) and move context into secondary text.
- Use fixed semantic colors:
  - Positive/uptrend: green-cyan family
  - Peak/highlight: warm amber family
  - Drawdown/risk: red family
- Do not overlay labels on the same hue as data marks without contrast buffer.

### 13.5 Transition and Effects Safety

- If scene contains chart labels, avoid aggressive incoming slide over label zone.
- Limit simultaneous high-salience effects (particles, heavy glow, large zoom) to one per scene focal phase.
- Keep transitions in `650ms` to `900ms` for short financial videos.
- Use particles as accent only (`opacity <= 0.5`, moderate count).

### 13.6 Pre-Render Agent Checklist

- [ ] No text-over-text collisions at any timestamp.
- [ ] No label overlaps with chart marks.
- [ ] Chart axis/grid/data/labels drawn in correct order.
- [ ] Data labels readable at 1080p (quick frame spot-check at 3+ timestamps).
- [ ] Scene uses no more than one dominant focal point at a time.
- [ ] All animated starts and ends stay inside safe envelope.
- [ ] Swatch roles are mapped and consistent across all scenes.
- [ ] Semantic color mapping is consistent (positive/negative/neutral).
- [ ] Contrast targets pass for text/annotation layers.
- [ ] No unsanctioned palette colors were introduced.

### 13.7 Anti-Patterns (Forbidden)

- Reusing same center Y coordinate for multiple headline/value layers active simultaneously.
- Putting subtitles directly on top of KPI values or chart annotations.
- Building line charts with one long rotated rectangle crossing multiple turning points.
- Using dense particles behind small text.
- Introducing both major camera zoom and major text motion at the same moment on dense data scenes.

### 13.8 External Visual Asset Strategy (HF Spaces)

Use generated assets when native primitives are not enough for clarity or appeal.

- **Image generation** (for charts backplates, thematic stills, branded textures):
  - `https://mcp-tools-z-image-turbo.hf.space/gradio_api/mcp/`
- **Image-to-video generation** (for motion backgrounds or transitional visual beats):
  - `https://alexnasa-ltx-2-turbo.hf.space/gradio_api/mcp/`

### 13.8.1 When to Use External Assets

- Use when scene readability or storytelling improves versus pure text/shape layers.
- Use for short atmospheric transitions, not to replace primary data readability.
- Keep financial values and labels rendered as native text layers for crispness.

### 13.8.2 Asset Safety Rules

- Generated assets must not reduce chart legibility (apply tint/blur/darken if needed).
- Keep background motion subtle behind data (`low contrast`, `low velocity`).
- Never place high-frequency textures directly under small numeric labels.
- All externally generated visuals must still obey M-margin and text occupancy rules.

### 13.9 Short Finance Video Composition Template (Agent Default)

- Scene 1: Branded intro (single headline + subhead, no competing labels).
- Scene 2: KPI cards (no overlaps, one metric per card).
- Scene 3: Precision line chart (annotate one peak and one drawdown max).
- Scene 4: Bar comparison (consistent baseline and spacing).
- Scene 5: Summary close (single headline + one supporting line).

### 13.10 Engine Features for Safer Typography

- Text collision prevention runs during frame rendering for non-position-animated text layers.
- Use explicit `textAlign` on each text layer to avoid unintended inherited alignment.
- New text styling fields for quality and readability:
  - `textStroke`: outline text for contrast on busy backgrounds.
  - `textMask`: `cutout` or `inverse` mask behavior for creative cutout effects.

Example:

```json
{
  "type": "text",
  "text": "PEAK $118.75",
  "fontFamily": "Arial",
  "fontSize": 54,
  "textAlign": "center",
  "textStroke": {
    "color": { "r": 12, "g": 16, "b": 30, "a": 1 },
    "width": 3
  },
  "textMask": {
    "mode": "cutout"
  }
}
```

### 13.11 External Visual Asset Workflow (Companion Assets)

For non-chart, non-text accompaniment assets:

- Image generation:
  - `autovid assets image "prompt" -o assets/images/scene-bg.png`
- Image-to-video generation:
  - `autovid assets video assets/images/scene-bg.png "prompt" -o assets/videos/scene-bg.mp4`

These commands generate local media + sidecar metadata files (`*.asset.json`) that can be used in `image` and `video` layers.

---

## 14. AutoVid Implementation Reference

### Recommended Scene Configuration

```json
{
  "config": {
    "width": 1920,
    "height": 1080,
    "fps": 30,
    "backgroundColor": { "r": 15, "g": 20, "b": 30, "a": 1 }
  },
  "scene": {
    "transition": { "type": "fade", "duration": 800 },
    "layers": [
      { "type": "text", "fontSize": 84, "fontWeight": "bold" },
      { "type": "text", "fontSize": 38, "fontWeight": "normal" }
    ]
  }
}
```

### Animation Timing Standards

| Element    | Entrance        | Duration   | Easing       |
| ---------- | --------------- | ---------- | ------------ |
| Headline   | fade + position | 600ms      | easeOut      |
| Subtext    | fade            | 400ms      | easeOut      |
| List items | stagger fade    | 200ms each | easeOut      |
| Shapes     | scale + fade    | 500ms      | easeOutCubic |
| Background | opacity         | 800ms      | linear       |

---

## Summary: Satori Graphics Principles in AutoVid

1. **Hierarchy First** — Size, weight, position establish importance
2. **Contrast Creates Focus** — Use color, scale, position strategically
3. **Consistency Builds Recognition** — Repeat fonts, colors, timing
4. **Flow Guides the Viewer** — Design the eye's journey
5. **Balance Feels Right** — Symmetry or intentional asymmetry
6. **Space is Powerful** — Negative space adds sophistication
7. **Motion Has Rules** — Timing, easing, anticipation matter
8. **Safe Boundaries** — M-width margins prevent broken layouts
9. **Pre-Render Checklist** — Verify before final output

---

_Style guide inspired by Satori Graphics' professional design principles_
_AutoVid v0.1.0 Compatible_
