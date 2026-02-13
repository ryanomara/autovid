# AutoVid - Autonomous Video Generation Platform

🎬 **Status: Active Development** | ✅ Tests Passing | 🚀 Multi-Platform

AutoVid is a next-generation video creation platform designed for LLM agents and humans. A simpler, more elegant alternative to Remotion.

## Quick Start

```bash
# Install dependencies
npm install

# Build
npm run build

# Create a video
node dist/cli/index.js create examples/simple-title.json output.mp4

# Run tests
npm test

# Start MCP server
node dist/mcp/server-simple.js
```

## Features

### Core Capabilities

- ✅ **Pure JavaScript Rendering** - No native dependencies, runs anywhere
- ✅ **Professional Animations** - 20+ easing functions, smooth transitions
- ✅ **Multi-Platform** - CLI, Desktop (Electron), Web, MCP Server
- ✅ **Agent-First Design** - Built for LLM automation
- ✅ **Resumable Renders** - mem-o integration for checkpoint/resume
- ✅ **Zero Native Deps** - Portable across all platforms
- ✅ **Chart Layers** - Native line/bar chart rendering with animated reveal support
- ✅ **Text Safety Features** - Collision prevention, text stroke, and text cutout modes
- ✅ **HF Companion Assets** - CLI generation of image and image-to-video accompaniment assets

### Animation System

- Keyframe animations with interpolation
- Scene transitions (fade, slide, zoom, dissolve, wipe)
- Easing functions (linear, cubic, elastic, bounce, etc.)
- Property animations (position, scale, rotation, opacity, color)

### Design System

- Theme support (default, corporate, modern)
- Template library (title-slide, lower-third)
- Story structures (hero-journey, problem-solution, feature-benefit)
- Pacing calculator for different audiences

### Output Formats

- MP4 (H.264)
- WebM (VP9)
- GIF
- Frame sequences

## Project Structure

```
autovid/
├── src/
│   ├── core/              # Video engine
│   │   ├── engine/        # Rendering, compositor, timeline, FFmpeg
│   │   ├── animation/     # Easing, transitions
│   │   ├── design/        # Themes, templates
│   │   ├── storytelling/  # Story structures
│   │   └── assets/        # Asset loader
│   ├── cli/               # Command-line interface
│   ├── mcp/               # Model Context Protocol server
│   ├── types/             # TypeScript definitions
│   └── utils/             # Logger, memory
├── tests/                 # Test suites (19/19 passing)
├── examples/              # Example projects
├── web/                   # Web frontend
├── desktop/               # Electron app
├── skills/                # Agent skill definitions
└── docs/                  # Documentation
```

## Usage

### CLI Commands

```bash
# Create video from JSON
autovid create <input.json> <output.mp4>

# Render project directory
autovid render <project-dir>

# Generate preview frames
autovid preview <project-dir>

# List available templates
autovid templates

# Generate companion image asset (HF)
autovid assets image "cinematic trading floor background" -o assets/images/bg.png

# Generate companion video asset from image (HF)
autovid assets video assets/images/bg.png "subtle market motion" -o assets/videos/bg.mp4
```

### As Library

```typescript
import { renderProject } from 'autovid';

const project = {
  name: 'My Video',
  config: {
    width: 1920,
    height: 1080,
    fps: 30,
    duration: 5000,
    outputFormat: 'mp4',
  },
  scenes: [
    {
      id: 'scene1',
      startTime: 0,
      endTime: 5000,
      layers: [
        {
          id: 'text1',
          type: 'text',
          text: 'Hello AutoVid!',
          fontSize: 96,
          position: { x: 960, y: 540 },
        },
      ],
    },
  ],
  audio: [],
};

await renderProject(project, {
  outputPath: 'output.mp4',
  onProgress: (progress) => {
    console.log(`${progress.percentage}% complete`);
  },
});
```

### MCP Server

```bash
# Start server (stdio transport)
node dist/mcp/server-simple.js

# Tool: create_video
{
  "name": "create_video",
  "arguments": {
    "projectPath": "project.json",
    "outputPath": "output.mp4"
  }
}
```

## Agent Skills

AutoVid includes cross-platform skill definitions for:

- **Claude** (`.claude/skills/`)
- **GitHub Copilot** (`skills/copilot/`)
- **OpenCode** (`.opencode/skills/`)

Skills enable LLM agents to generate videos autonomously.

## Examples

### Simple Title Animation

```json
{
  "name": "Title Animation",
  "config": { "width": 1920, "height": 1080, "fps": 30, "duration": 5000 },
  "scenes": [
    {
      "id": "title",
      "startTime": 0,
      "endTime": 5000,
      "layers": [
        {
          "type": "text",
          "text": "Welcome to AutoVid",
          "fontSize": 96,
          "position": { "x": 960, "y": 540 },
          "animations": [
            {
              "property": "opacity",
              "keyframes": [
                { "time": 0, "value": 0 },
                { "time": 1000, "value": 1, "easing": "easeOut" }
              ]
            }
          ]
        }
      ]
    }
  ],
  "audio": []
}
```

See `examples/` directory for more examples.

## Architecture

### Why Simpler Than Remotion?

1. **No React/Puppeteer** - Direct frame generation, no browser overhead
2. **Pure JavaScript** - No native canvas, runs in any environment
3. **Agent-Native** - Designed for LLM automation from the ground up
4. **Resumable** - Built-in checkpoint/resume with mem-o
5. **Multi-Platform** - One codebase, multiple interfaces

### Key Innovations

1. **Pixel Buffer Rendering** - Pure JS pixel manipulation without canvas API
2. **Concatenated Frames** - Solved FFmpeg raw video encoding with frame concatenation
3. **Cross-Platform Skills** - Single skill definition works across Claude, Copilot, OpenCode
4. **Progressive Memory** - Smart caching and resumption for long renders

## Requirements

- **Node.js** 18+
- **FFmpeg** (must be installed on system)
- **npm** or **yarn**

## Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- tests/unit/easing.test.ts

# Run with coverage
npm test -- --coverage
```

Current test status: **19/19 passing** ✅

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run build -- --watch

# Lint
npm run lint

# Format
npm run format
```

## Documentation

- `docs/style-guide.md` - Satori-inspired style rules + agent guardrails
- `docs/clean-room-commercial-checklist.md` - Commercial-safe clean-room policy
- `docs/ROADMAP.md` - Near-term milestones and implementation plan
- `docs/adr/` - Architecture Decision Records
- `examples/` - Working example projects
- `skills/` - Agent skill documentation

## License

MIT

## Contributing

This is an autonomous project created as a demonstration of LLM-driven development. Contributions welcome!

## Acknowledgments

- Inspired by [Remotion](https://github.com/remotion-dev/remotion)
- Built with TypeScript, Node.js, and FFmpeg
- Designed for GitHub Copilot SDK integration

---

**AutoVid**: Making video generation simple, elegant, and accessible to agents and humans alike.
