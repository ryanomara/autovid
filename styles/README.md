# Styles Folder

Codified layout and generation rules plus reusable templates.

- `styles/cyberpunk-finance-style.json`: bleed layout contract + generation/placement rules
- `styles/cyberpunk-finance-template.json`: reusable AutoVid template using bleed-driven scene structure
- `styles/foodie-magazine-style.json`: editorial foodie visual rules + audio prompt policy
- `styles/foodie-magazine-template.json`: reusable foodie-magazine bleed template

Music/SFX template convention:

- Template includes a low-volume BGM slot: `assets/audio/{BGM_TRACK}.wav`
- Generate with `autovid assets audio "<prompt>" -o assets/audio/<name>.wav`
- Prompt defaults should be: `instrumental only, lyricless, 90 BPM` or `instrumental only, lyricless, 120 BPM`

Use `cyberpunk-finance-style.json`/`styles/cyberpunk-finance-template.json` or `styles/foodie-magazine-style.json`/`styles/foodie-magazine-template.json` as policy + composition bases.
