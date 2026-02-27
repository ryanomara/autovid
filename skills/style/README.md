# Scene Prompt Styles

Composable prompt style blocks for AutoVid image/video asset generation.

Use these blocks to assemble prompts per scene type while keeping visual consistency.

- Core prompt blocks: `skills/style/prompt-styles.json`
- Cyberpunk finance profile: `skills/style/cyberpunk-finance-scenes.md`
- Foodie magazine profile: `skills/style/foodie-magazine-scenes.md`

Recommended assembly order:

1. Subject block
2. Shot/composition block
3. Scene-function block (hook/thesis/chart/cta)
4. Style signature block
5. Technical quality block
6. Optional negatives

## Agent Auto-Pick: Chart Motion

For line charts, agents should set `chart.style.lineRevealEasing` by intent:

- `organic` (default): balanced premium motion, general-purpose finance.
- `cinematic`: slower settle at points, boardroom/editorial tone.
- `elastic`: energetic overshoot feel for hype/growth moments.
- `bounce`: playful explainers or lightweight social narratives.
- `linear`: strict utility/diagnostic views.

If no explicit creative direction is provided, prefer:

1. `organic` for normal chart storytelling
2. `cinematic` for premium/high-trust narratives
3. `linear` only when clarity and neutrality are the sole goal
