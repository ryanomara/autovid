---
name: style
description: Composable scene prompt styles and bleed-driven layout rules for AutoVid. Use when agents need consistent visual direction, aspect-aware asset generation, and style-template initialization.
license: MIT
compatibility: claude,opencode,copilot
---

# Style Skill

Use this skill when creating style-consistent AutoVid projects across CLI, MCP, and API.

## What This Skill Provides

- Bleed layout contract for `fullbleed`, `halfbleed`, `thirdbleed`, `quarterbleed`
- Aspect-first asset generation guidance
- Seed reuse strategy for stable identity across aspect variants
- Scene-level prompt style blocks for composable image/video prompts

## Canonical Files

- `styles/cyberpunk-finance-style.json`
- `styles/cyberpunk-finance-template.json`
- `skills/style/prompt-styles.json`
- `skills/style/cyberpunk-finance-scenes.md`

## CLI Usage

```bash
autovid styles list
autovid styles init cyberpunk-finance examples/cyberpunk-project.json --set HOOK_HEADLINE="ARH // SHORT SIGNAL"
autovid styles pipeline cyberpunk-finance outputs/cyberpunk.mp4 --set THESIS_HEADLINE="MARGIN CLIFF"
```

## MCP Tooling

- `list_styles`
- `init_style_project`
- `render_style_pipeline`

## API Usage

```typescript
import { getAvailableStyles, createStyleProject } from 'autovid';

const styles = getAvailableStyles();
await createStyleProject({
  styleId: 'cyberpunk-finance',
  outputPath: 'examples/cyberpunk-project.json',
  variables: {
    HOOK_HEADLINE: 'ARH // SHORT SIGNAL',
  },
});
```
