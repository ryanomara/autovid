---
name: video-generation
description: Generate automated animated videos with smooth transitions, animations, audio, and branding. Use when creating video presentations, explainer videos, social media content, or marketing materials. Handles scene composition, timing, animations, and rendering to MP4/WebM/GIF.
license: MIT
compatibility: claude,opencode,copilot
---

# Video Generation Skill

Create professional animated videos programmatically using the AutoVid engine.

## When to Use This Skill

Use when:
- Creating animated presentations or explainer videos
- Generating social media video content  
- Building marketing or promotional videos
- Producing educational materials
- User mentions: "video", "animation", "presentation", "render", "animated"

## Prerequisites

AutoVid must be installed and FFmpeg available:

```bash
npm install -g autovid
ffmpeg -version
```

## Core Workflow

### 1. Define Video Project

Create a JSON specification:

```json
{
  "id": "my-video",
  "name": "Product Demo",
  "config": {
    "width": 1920,
    "height": 1080,
    "fps": 30,
    "duration": 10000,
    "outputFormat": "mp4",
    "quality": "high"
  },
  "scenes": [
    {
      "id": "intro",
      "startTime": 0,
      "endTime": 3000,
      "layers": [
        {
          "id": "title",
          "type": "text",
          "text": "Welcome",
          "fontFamily": "Arial",
          "fontSize": 72,
          "color": { "r": 255, "g": 255, "b": 255, "a": 1 },
          "position": { "x": 960, "y": 540 },
          "scale": { "x": 1, "y": 1 },
          "rotation": 0,
          "opacity": 1,
          "startTime": 0,
          "endTime": 3000,
          "animations": [
            {
              "property": "opacity",
              "keyframes": [
                { "time": 0, "value": 0, "easing": "easeOut" },
                { "time": 1000, "value": 1 },
                { "time": 2000, "value": 1 },
                { "time": 3000, "value": 0, "easing": "easeIn" }
              ]
            }
          ]
        }
      ],
      "transition": {
        "type": "fade",
        "duration": 500
      }
    }
  ]
}
```

### 2. Render Video

```bash
autovid create project.json output.mp4
```

Or use MCP if available:

```typescript
await mcp.callTool('create_composition', {
  title: 'Product Demo',
  duration: 10,
  scenes: [/* ... */]
});
```

### 3. Monitor Progress

The CLI shows real-time progress:

```
Rendering frame 120/300 (40%) - ETA: 45s
```

## Animation Patterns

### Fade In/Out

```json
{
  "property": "opacity",
  "keyframes": [
    { "time": 0, "value": 0 },
    { "time": 1000, "value": 1, "easing": "easeOut" }
  ]
}
```

### Slide In

```json
{
  "property": "position.x",
  "keyframes": [
    { "time": 0, "value": -100 },
    { "time": 1000, "value": 960, "easing": "easeOutCubic" }
  ]
}
```

### Scale Up

```json
{
  "property": "scale.x",
  "keyframes": [
    { "time": 0, "value": 0.5 },
    { "time": 1000, "value": 1, "easing": "easeOutElastic" }
  ]
}
```

## Layer Types

### Text Layers
- Properties: text, fontFamily, fontSize, color, alignment
- Best for: titles, captions, labels

### Image Layers  
- Properties: src (path or URL), fit (cover/contain/fill)
- Best for: photos, logos, graphics

### Shape Layers
- Properties: shapeType, dimensions, fill, stroke
- Best for: backgrounds, geometric elements, dividers

### Video Layers
- Properties: src, playbackRate, volume
- Best for: stock footage, screen recordings

## Easing Functions

Available easings: `linear`, `easeIn`, `easeOut`, `easeInOut`, `easeInCubic`, `easeOutCubic`, `easeInOutCubic`, `easeInElastic`, `easeOutElastic`, `easeInBounce`, `easeOutBounce`

Choose based on feel:
- `linear`: Mechanical, constant speed
- `easeOut`: Natural deceleration  
- `easeInOut`: Smooth start and stop
- `easeOutElastic`: Playful bounce
- `easeOutBounce`: Ball dropping effect

## Best Practices

1. **Timing**: Allow 3-5 seconds per key message
2. **Transitions**: Keep under 500ms for professionalism
3. **Hierarchy**: Larger text = more important
4. **Contrast**: Ensure text readable on backgrounds
5. **Motion**: Use easing for organic feel
6. **Pacing**: Don't rush - viewers need time to process

## Common Patterns

### Title Sequence
```json
{
  "scenes": [
    {
      "startTime": 0,
      "endTime": 3000,
      "layers": [
        {
          "type": "shape",
          "shapeType": "rectangle",
          "fill": { "r": 20, "g": 20, "b": 50, "a": 1 }
        },
        {
          "type": "text",
          "text": "Your Title",
          "fontSize": 96,
          "animations": [/* fade + scale */]
        }
      ]
    }
  ]
}
```

### Lower Third
```json
{
  "type": "text",
  "text": "Speaker Name",
  "position": { "x": 100, "y": 900 },
  "fontSize": 36,
  "startTime": 1000,
  "endTime": 5000,
  "animations": [{
    "property": "position.x",
    "keyframes": [
      { "time": 1000, "value": -200 },
      { "time": 1500, "value": 100, "easing": "easeOut" }
    ]
  }]
}
```

## Troubleshooting

**Issue**: Animations look jerky
**Solution**: Increase FPS to 60 or use smoother easing functions

**Issue**: Text not visible
**Solution**: Check color contrast, increase fontSize, adjust opacity

**Issue**: Rendering slow
**Solution**: Reduce resolution during development, render full size at end

**Issue**: FFmpeg errors
**Solution**: Verify FFmpeg installed: `ffmpeg -version`

## Output Formats

- **MP4**: Best for web, social media, presentations (H.264 codec)
- **WebM**: Open format, smaller files (VP9 codec)  
- **GIF**: Loops, no audio, large file size

## CLI Commands

```bash
autovid create input.json output.mp4
autovid create input.json output.webm
autovid create input.json output.gif

autovid create input.json output.mp4 --fps 60 --quality ultra

autovid templates list
autovid templates apply corporate output.json

autovid preview project.json
```

## MCP Tools

If using via MCP server:

- `create_composition`: Define video structure
- `add_scene`: Add scenes to composition  
- `render_video`: Render to output file
- `preview_frame`: Generate single frame preview
- `list_templates`: Browse templates

## Examples

See repository examples/:
- `examples/simple-title.json` - Basic title animation
- `examples/multi-scene.json` - Multiple scenes with transitions
- `examples/lower-third.json` - Text overlay pattern
- `examples/logo-reveal.json` - Logo animation

## Advanced Topics

For complex animations, custom effects, and programmatic generation, see AutoVid documentation at github.com/yourusername/autovid
