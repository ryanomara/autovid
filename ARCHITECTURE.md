# AutoVid Architecture

## Design Philosophy

**Simpler than Remotion**: Focus on LLM-agent workflow while maintaining power
**Multi-Platform First**: CLI, Desktop, Web, MCP - all first-class citizens
**Resumable Operations**: mem-o integration for long-running jobs
**Agent-Native**: GitHub Copilot SDK integration for agentic capabilities

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Interface Layer                         │
├──────────┬──────────┬──────────┬──────────┬─────────────────┤
│   CLI    │ Desktop  │   Web    │   MCP    │  Agent Skills   │
│          │ (Electron│ (Next.js)│  Server  │ (Claude/Copilot)│
│          │ /Tauri)  │          │          │                 │
└──────────┴──────────┴──────────┴──────────┴─────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Core Engine Layer                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Video Engine │  │  Animation   │  │  Storytelling   │  │
│  │              │  │    System    │  │     Engine      │  │
│  │ - Rendering  │  │ - Easing     │  │ - Narrative     │  │
│  │ - Compositing│  │ - Transitions│  │ - Timing        │  │
│  │ - FFmpeg     │  │ - Effects    │  │ - Pacing        │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Audio System │  │   Design     │  │     Asset       │  │
│  │              │  │   System     │  │   Management    │  │
│  │ - Music      │  │ - Themes     │  │ - Images        │  │
│  │ - Voice TTS  │  │ - Branding   │  │ - Videos        │  │
│  │ - Sync       │  │ - Templates  │  │ - URLs          │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Infrastructure Layer                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   Logging    │  │   Testing    │  │    Memory       │  │
│  │   (Pino)     │  │   (Vitest)   │  │    (mem-o)      │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ Copilot SDK  │  │    Cache     │                        │
│  │  Integration │  │   System     │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Video Engine
**Responsibility**: Frame-by-frame rendering and video encoding

- **Frame Renderer**: Canvas/WebGL-based rendering
- **Compositor**: Layer composition and blending
- **Encoder**: FFmpeg integration for final output
- **Format Support**: MP4, WebM, GIF, frame sequences

### 2. Animation System
**Responsibility**: Smooth, organic motion

- **Easing Functions**: ease-in, ease-out, elastic, bounce, custom
- **Transition Library**: fade, slide, zoom, rotate, morph
- **Timeline Engine**: Keyframe-based animation sequencing
- **Interpolation**: Smooth value transitions

### 3. Storytelling Engine
**Responsibility**: Narrative structure and pacing

- **Scene Manager**: Scene transitions and flow
- **Timing Controller**: Dynamic pacing based on content
- **Narrative Templates**: Story structures (hero's journey, problem-solution, etc.)
- **Attention System**: Visual guidance for viewer focus

### 4. Audio System
**Responsibility**: Music and voice integration

- **Music Library**: Background music with mood selection
- **TTS Integration**: Voice synthesis for narration
- **Audio Mixing**: Multi-track audio composition
- **Sync Engine**: Frame-accurate audio-visual synchronization

### 5. Design System
**Responsibility**: Corporate branding and visual consistency

- **Theme Engine**: Color palettes, fonts, spacing
- **Brand Manager**: Logo, watermark, corporate identity
- **Template Library**: Pre-built layouts and styles
- **Style Inheritance**: Cascading design rules

### 6. Asset Management
**Responsibility**: External resource integration

- **Image Loader**: Local and remote image handling
- **Video Importer**: Video clip integration
- **URL Fetcher**: Web resource downloading
- **Cache System**: Efficient asset caching

## Interface Implementations

### CLI Interface
```bash
autovid create --script story.json --output video.mp4
autovid render --template corporate --input data.json
autovid preview --port 3000
```

### MCP Server
Exposes tools for LLM agents:
- `create_video`: Generate video from specification
- `preview_frame`: Render single frame preview
- `list_templates`: Available templates
- `apply_theme`: Apply corporate branding

### Agent Skills
Three skill definitions:
1. **Claude Skill**: MCP-based integration
2. **GitHub Copilot Skill**: SDK-based integration
3. **OpenCode Skill**: Combined approach

## Data Flow

### Video Creation Flow
```
1. Input Specification (JSON/YAML/Natural Language)
   ↓
2. Storytelling Engine (parse narrative, create timeline)
   ↓
3. Design System (apply theme, load assets)
   ↓
4. Animation System (calculate keyframes, transitions)
   ↓
5. Frame Renderer (render each frame)
   ↓
6. Audio System (add music, voice)
   ↓
7. FFmpeg Encoder (create final video)
   ↓
8. Output (video file + metadata)
```

### Resumable Operations (mem-o)
- Save rendering state after each scene
- Store asset cache
- Preserve configuration
- Enable stop/restart at any point

## Technology Stack

### Core
- **TypeScript**: Type-safe development
- **Node.js**: Runtime environment
- **Zod**: Runtime validation

### Rendering
- **Canvas/node-canvas**: 2D rendering
- **FFmpeg**: Video encoding
- **fluent-ffmpeg**: FFmpeg wrapper

### Interfaces
- **Commander**: CLI framework
- **Electron/Tauri**: Desktop app
- **Next.js/React**: Web frontend
- **@modelcontextprotocol/sdk**: MCP server

### Infrastructure
- **Pino**: Structured logging
- **Vitest**: Testing framework
- **@github/copilot-sdk**: Agent capabilities
- **mem-o**: Persistent memory

## Key Innovations vs Remotion

1. **Agent-First Design**: Built for LLM agents from ground up
2. **Simpler API**: Less boilerplate, more declarative
3. **Resumable**: Long videos can be interrupted and resumed
4. **Multi-Platform**: Not just web-based
5. **Storytelling Native**: Built-in narrative intelligence
6. **Template System**: Ready-to-use corporate templates

## Security Considerations

- Sandboxed rendering for untrusted input
- Asset URL validation and sanitization
- Resource limits (memory, CPU, duration)
- Secure credential handling for API integrations

## Performance Goals

- Frame rendering: <100ms per frame (1080p)
- Preview latency: <500ms
- Memory efficiency: <2GB for typical projects
- Parallel rendering: Multi-core utilization

## Next Steps

1. Implement core video engine
2. Build animation system
3. Create CLI interface
4. Develop MCP server
5. Integrate GitHub Copilot SDK
6. Implement mem-o persistence
7. Add comprehensive testing
8. Build desktop and web interfaces
