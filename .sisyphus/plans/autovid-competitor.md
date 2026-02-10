# AutoVid Remotion Competitor Roadmap

## TL;DR

> **Quick Summary**: Transform AutoVid into a full Remotion competitor with spring animations, 3D graphics (Three.js), real TTS (HuggingFace Spaces), expanded MCP tools (8→20+), and LLM-native APIs while maintaining the "simpler than Remotion" philosophy.
>
> **Deliverables**:
>
> - Spring physics & path animation system
> - Camera system with cinematic movements
> - Three.js 3D integration (GPU + CPU fallback)
> - Real TTS integration (HuggingFace: Qwen3-TTS, Chatterbox)
> - Audio visualization & beat detection
> - MCP expansion (8 → 20+ tools)
> - Copilot SDK integration
> - Natural language video API
> - Particle systems & Lottie support
> - Real video layer (replace placeholder)
>
> **Estimated Effort**: XL (6 phases, 22 tasks, ~43 subtasks)
> **Parallel Execution**: YES - 6 waves
> **Critical Path**: Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6

---

## Context

### Original Request

Make AutoVid a serious Remotion competitor with LLM-native access, including all missing features (spring animations, 3D, audio visualization, etc.) with video layers implemented LAST.

### User Decisions

| Decision                  | Value                   | Notes                                                         |
| ------------------------- | ----------------------- | ------------------------------------------------------------- |
| **TTS Provider**          | HuggingFace Spaces      | Primary: Qwen3-TTS, Fallback: Chatterbox Multilingual         |
| **QA Weights**            | Configurable via config | Defaults: 50% frame accuracy, 30% performance, 20% validation |
| **Copilot SDK**           | Yes, if beneficial      | Research integration patterns, include if adds value          |
| **Distributed Rendering** | Deferred to Phase 7+    | HIGH difficulty, $$$$ cost - see notes below                  |
| **GitHub Issues**         | Hierarchical            | Best for agent processing (milestone → epic → issue)          |

### Research Findings

**AutoVid Current State**:

- Production-ready: 9,000 LOC TypeScript, 18/18 tests passing
- Working: text (node-canvas), images (sharp), 20+ easings, 5 transitions, effects, 8 MCP tools, CLI, audio mixing
- Placeholder: Video layer (renders "VIDEO" text), TTS (generates sine waves)
- Missing vs Remotion: Spring physics, path animations, camera system, 3D/Three.js, audio visualization, Lottie, particles

**TTS Current Implementation**:

- Location: `src/core/audio/mixer.ts:84-117`
- Status: Placeholder - generates sine wave tones based on text length
- Interface: Already defined in `src/types/index.ts` (text, voice, rate, pitch)
- Integration point: Replace `synthesizeSpeech()` method

---

## Work Objectives

### Core Objective

Transform AutoVid from a capable video generation platform into a full Remotion competitor with superior LLM integration, maintaining the "simpler than Remotion" philosophy.

### Concrete Deliverables

- `src/core/animation/spring.ts` - Spring physics engine
- `src/core/animation/path.ts` - Path/motion animation system
- `src/core/animation/camera.ts` - Virtual camera system
- `src/core/animation/transitions.ts` - Expanded transitions (5 → 15+)
- `src/core/audio/tts.ts` - TTS provider abstraction
- `src/core/audio/providers/huggingface.ts` - HuggingFace TTS integration
- `src/core/audio/visualization.ts` - Audio visualization engine
- `src/core/audio/beat-detection.ts` - Beat detection system
- `src/core/3d/` - Three.js integration module
- `src/core/effects/particles.ts` - Particle system
- `src/core/effects/lottie.ts` - Lottie animation support
- `src/core/layers/video.ts` - Real video layer (replace placeholder)
- `src/mcp/tools/` - Expanded MCP tools (8 → 20+)
- `src/api/natural-language.ts` - Natural language video API
- `src/integrations/copilot.ts` - Copilot SDK integration

### Definition of Done

- [ ] All 18 existing tests still pass (backward compatibility)
- [ ] New test coverage ≥80% for new modules
- [ ] MCP tools increased from 8 to 20+
- [ ] Spring animations match Remotion's spring() behavior
- [ ] 3D scenes render correctly on GPU and CPU
- [ ] TTS generates real audio via HuggingFace Spaces
- [ ] Video layer processes actual video files
- [ ] Documentation updated for all new features

### Must Have

- Spring physics with stiffness/damping/mass parameters
- Path animations with bezier curve support
- Camera movements (pan, tilt, zoom, dolly, tracking)
- Real TTS with HuggingFace provider (Qwen3-TTS primary, Chatterbox fallback)
- Three.js 3D rendering
- CPU fallback for all GPU features
- 20+ MCP tools
- Automated test suite for all new features

### Must NOT Have (Guardrails)

- ❌ Browser/Puppeteer dependencies (maintain pure JS philosophy)
- ❌ Breaking changes to existing API (backward compatible)
- ❌ Manual verification acceptance criteria
- ❌ GPU-only features (must have CPU fallback)
- ❌ Distributed/Lambda rendering (Phase 7+)
- ❌ Live preview studio (out of scope)
- ❌ Deeply nested JSON schemas (keep flat for LLM)
- ❌ "User manually tests..." in acceptance criteria

---

## HuggingFace TTS Integration

### Provider Options

#### Primary: Qwen3-TTS

| Attribute     | Details                                                                                       |
| ------------- | --------------------------------------------------------------------------------------------- |
| **Space URL** | `https://huggingface.co/spaces/Qwen/Qwen3-TTS`                                                |
| **Languages** | 10: Chinese, English, Japanese, Korean, German, French, Russian, Portuguese, Spanish, Italian |
| **Features**  | Voice cloning, voice design, emotion control, streaming generation                            |
| **Latency**   | 97ms ultra-low latency (dual-track streaming)                                                 |
| **License**   | Apache 2.0                                                                                    |

#### Fallback: Chatterbox Multilingual

| Attribute     | Details                                                                |
| ------------- | ---------------------------------------------------------------------- |
| **Space URL** | `https://huggingface.co/spaces/ResembleAI/Chatterbox-Multilingual-TTS` |
| **Languages** | 23 languages                                                           |
| **Features**  | Zero-shot TTS, emotion exaggeration control, voice cloning             |
| **Quality**   | 63.75% preference over ElevenLabs in blind tests                       |
| **Latency**   | ~200ms                                                                 |
| **License**   | MIT                                                                    |

### Risks & Mitigations

| Risk                    | Impact                       | Mitigation                                                     |
| ----------------------- | ---------------------------- | -------------------------------------------------------------- |
| **Cold Start Latency**  | 30-60s on free tier          | Retry logic, queue management, warm-up requests                |
| **Rate Limits**         | Free: 1,000 req/5min         | Request throttling, exponential backoff, HF Pro for production |
| **Authentication**      | Private spaces require token | Support optional `HF_TOKEN` env var                            |
| **Availability**        | Spaces can restart/change    | Fallback chain: Qwen3 → Chatterbox → Placeholder               |
| **API Changes**         | Gradio API can change        | Pin Space versions, defensive parsing                          |
| **Audio Format**        | Output varies (WAV, MP3)     | Normalize via FFmpeg                                           |
| **Concurrent Requests** | Free tier single-threaded    | Request queue, parallel fallback providers                     |
| **Network Dependency**  | Requires internet            | Cache generated audio, offline placeholder mode                |

### Integration Pattern

```typescript
import { Client } from '@gradio/client';

const app = await Client.connect('Qwen/Qwen3-TTS', {
  hf_token: process.env.HF_TOKEN, // Optional for public spaces
});

const result = await app.predict('/predict', {
  text: 'Hello world',
  voice: 'default',
});
```

### Provider Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    TTS Provider Abstraction              │
├─────────────────────────────────────────────────────────┤
│  TTSProvider Interface                                   │
│  ├── synthesize(text, voice, options) → AudioBuffer     │
│  ├── listVoices() → Voice[]                             │
│  └── healthCheck() → boolean                            │
├─────────────────────────────────────────────────────────┤
│  Implementations:                                        │
│  ├── HuggingFaceProvider (Qwen3-TTS, Chatterbox)       │
│  └── PlaceholderProvider (offline/testing)              │
├─────────────────────────────────────────────────────────┤
│  Fallback Chain: Qwen3 → Chatterbox → Placeholder       │
│  With: Retry logic, caching, health monitoring          │
└─────────────────────────────────────────────────────────┘
```

---

## Schema & API Changes

### New Types (src/types/index.ts)

```typescript
// Spring Animation Config
export interface SpringConfig {
  stiffness?: number; // Default: 100
  damping?: number; // Default: 10
  mass?: number; // Default: 1
  velocity?: number; // Default: 0
}

// Path Animation
export interface PathAnimation {
  points: Position[];
  type: 'linear' | 'bezier' | 'catmull-rom';
  closed?: boolean;
}

// Camera
export interface CameraConfig {
  position: Position;
  zoom: number;
  rotation: number;
  movements?: CameraMovement[];
}

export interface CameraMovement {
  type: 'pan' | 'tilt' | 'zoom' | 'dolly' | 'tracking';
  from: number;
  to: number;
  startTime: number;
  endTime: number;
  easing?: EasingType;
}

// 3D Layer
export interface Layer3D extends BaseLayer {
  type: '3d';
  scene: ThreeJSScene;
  camera?: Camera3D;
  renderer?: 'gpu' | 'cpu' | 'auto';
}

// Audio Visualization
export interface AudioVisualization {
  type: 'waveform' | 'frequency' | 'bars';
  audioTrackId: string;
  style: VisualizationStyle;
}

// Particle System
export interface ParticleConfig {
  preset?: 'snow' | 'confetti' | 'fire' | 'smoke' | 'sparks';
  count: number;
  emitter: EmitterConfig;
  physics?: ParticlePhysics;
}

// TTS Provider Config (extended)
export interface TTSConfig {
  provider: 'huggingface' | 'placeholder';
  model?: 'qwen3-tts' | 'chatterbox';
  voice: string;
  rate?: number;
  pitch?: number;
  emotion?: string;
  fallbackChain?: string[];
}

// QA Configuration
export interface QAConfig {
  weights: {
    frameAccuracy: number; // Default: 0.50
    performance: number; // Default: 0.30
    validation: number; // Default: 0.20
  };
  thresholds: {
    pass: number; // Default: 0.80
    warn: number; // Default: 0.60
  };
}
```

### New MCP Tools (Phase 4)

**Batch 1 (8 → 14):**

- `add_spring_animation` - Apply spring physics to layer
- `add_camera_movement` - Add camera pan/tilt/zoom/dolly
- `add_path_animation` - Animate along motion path
- `set_transition` - Configure scene transitions
- `add_audio_visualization` - Add audio-reactive visuals
- `generate_tts` - Generate speech from text

**Batch 2 (14 → 20+):**

- `add_3d_scene` - Create Three.js 3D scene
- `load_gltf_model` - Load 3D model
- `add_particles` - Add particle system
- `add_lottie` - Add Lottie animation
- `detect_beats` - Analyze audio for beats
- `auto_pace_to_audio` - Sync video to audio beats
- `describe_video` - Natural language video spec
- `apply_template` - Apply cinematic template
- `add_video_layer` - Add video file layer

---

## Verification Strategy

### Test Decision

- **Infrastructure exists**: YES (bun test, 18/18 passing)
- **User wants tests**: Automated metric-based QA
- **Framework**: bun test (existing)

### QA Metrics Configuration

```typescript
// Default weights (configurable via .autovidrc or config.ts)
const defaultQAConfig: QAConfig = {
  weights: {
    frameAccuracy: 0.5, // 50% - visual output correctness
    performance: 0.3, // 30% - render speed, memory
    validation: 0.2, // 20% - schema, error handling
  },
  thresholds: {
    pass: 0.8, // 80% overall to pass
    warn: 0.6, // 60% triggers warnings
  },
};
```

### Override via Config

```json
{
  "qa": {
    "weights": {
      "frameAccuracy": 0.6,
      "performance": 0.25,
      "validation": 0.15
    }
  }
}
```

### Verification Template (Per Task)

````markdown
**Acceptance Criteria**:

**Automated Tests:**

- [ ] `bun test src/[module].test.ts` → All tests pass
- [ ] Coverage ≥80% for new code

**Functional Verification:**

```bash
# Command to verify functionality
bun -e "import { X } from './src/...'; console.log(X.verify())"
# Expected: [specific output]
```
````

**Performance Verification:**

```bash
# Benchmark command
bun run benchmark:[module]
# Expected: [metric] < [threshold]
```

**Evidence:**

- [ ] Test output captured
- [ ] Benchmark results recorded

```

---

## Parallel Execution Strategy

### Task Dependency Graph (6 Waves)

```

Wave 1 (Start Immediately) ─────────────────────────────────────
├── 1.1 Spring physics engine [no deps]
├── 1.4 Expand transitions (5→15+) [no deps]
└── 2.1 TTS provider abstraction [no deps]

Wave 2 (After Wave 1 core) ─────────────────────────────────────
├── 1.2 Path animation system [depends: 1.1]
├── 1.3 Camera system [depends: 1.1]
├── 2.2 HuggingFace TTS integration [depends: 2.1]
└── 2.3 Audio visualization [depends: 2.1]

Wave 3 (After Wave 2) ──────────────────────────────────────────
├── 2.4 Beat detection [depends: 2.3]
├── 3.1 Three.js integration [depends: Phase 1]
└── 4.1 MCP tools batch 1 [depends: 1.x, 2.1-2.2]

Wave 4 (After Wave 3) ──────────────────────────────────────────
├── 3.2 GPU renderer [depends: 3.1]
├── 3.3 CPU fallback renderer [depends: 3.1]
├── 3.4 GLTF model support [depends: 3.1]
└── 4.2 MCP tools batch 2 [depends: 4.1, 3.x]

Wave 5 (After Wave 4) ──────────────────────────────────────────
├── 4.3 Copilot SDK integration [depends: 4.2]
├── 4.4 Natural language API [depends: 4.2]
├── 5.1 Particle systems [depends: 3.x]
└── 5.2 Lottie support [depends: 1.x]

Wave 6 (Final) ─────────────────────────────────────────────────
├── 6.1 Video decoding [depends: all previous]
├── 6.2 Video compositing [depends: 6.1]
├── 6.3 Video textures (3D) [depends: 6.1, 3.x]
└── 6.4 Integration testing & docs [depends: 6.1-6.3]

````

### Dependency Matrix

| Task | Depends On | Blocks | Parallel With |
|------|------------|--------|---------------|
| 1.1 | None | 1.2, 1.3 | 1.4, 2.1 |
| 1.2 | 1.1 | 1.3 | 2.2, 2.3 |
| 1.3 | 1.1, 1.2 | Phase 2 | 2.2, 2.3 |
| 1.4 | None | None | 1.1, 2.1 |
| 2.1 | None | 2.2, 2.3 | 1.1, 1.4 |
| 2.2 | 2.1 | 4.1 | 1.2, 1.3, 2.3 |
| 2.3 | 2.1 | 2.4 | 1.2, 1.3, 2.2 |
| 2.4 | 2.3 | 4.2 | 3.1, 4.1 |
| 3.1 | Phase 1 | 3.2, 3.3, 3.4 | 2.4, 4.1 |
| 3.2 | 3.1 | 4.2 | 3.3, 3.4 |
| 3.3 | 3.1 | 4.2 | 3.2, 3.4 |
| 3.4 | 3.1 | 4.2 | 3.2, 3.3 |
| 4.1 | 1.x, 2.1-2.2 | 4.2 | 2.4, 3.1 |
| 4.2 | 4.1, 3.x | 4.3, 4.4 | None |
| 4.3 | 4.2 | None | 4.4, 5.1, 5.2 |
| 4.4 | 4.2 | None | 4.3, 5.1, 5.2 |
| 5.1 | 3.x | 6.x | 4.3, 4.4, 5.2 |
| 5.2 | 1.x | 6.x | 4.3, 4.4, 5.1 |
| 6.1 | All | 6.2, 6.3 | None |
| 6.2 | 6.1 | 6.4 | 6.3 |
| 6.3 | 6.1, 3.x | 6.4 | 6.2 |
| 6.4 | 6.1-6.3 | None | None |

---

## TODOs by Phase

### Phase 1: Animation Engine Enhancement

---

#### 1.1. Spring Physics Animation System

**What to do**:
- Implement `spring()` function matching Remotion's API
- Support stiffness, damping, mass, velocity parameters
- Integrate with existing animation system
- Add spring easing to keyframe animations

**Must NOT do**:
- Break existing easing functions
- Require external physics library

**Recommended Agent Profile**:
- **Category**: `ultrabrain`
- **Skills**: [`video-generation`]
- Reason: Complex mathematical animation logic requiring deep algorithmic understanding

**Parallelization**:
- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 1 (with 1.4, 2.1)
- **Blocks**: 1.2, 1.3
- **Blocked By**: None

**References**:
- `src/core/animation/easing.ts` - Existing easing system to extend
- `src/types/index.ts:Animation` - Animation type definitions
- Remotion spring docs: https://www.remotion.dev/docs/spring

**Acceptance Criteria**:
```bash
# Unit tests
bun test src/core/animation/spring.test.ts
# Expected: All tests pass

# Functional verification
bun -e "import { spring } from './src/core/animation/spring'; console.log(spring({ frame: 30, fps: 30, config: { stiffness: 100, damping: 10 } }))"
# Expected: Number between 0 and 1
````

**Commit**: YES

- Message: `feat(animation): add spring physics animation system`
- Files: `src/core/animation/spring.ts`, `src/core/animation/spring.test.ts`, `src/types/index.ts`

---

#### 1.2. Path Animation System

**What to do**:

- Implement motion path animations
- Support bezier curves, linear paths, catmull-rom splines
- Allow objects to follow paths over time
- Integrate with position animations

**Must NOT do**:

- Replace existing position animation system
- Require SVG path parsing (keep simple)

**Recommended Agent Profile**:

- **Category**: `ultrabrain`
- **Skills**: [`video-generation`]

**Parallelization**:

- **Can Run In Parallel**: YES (after 1.1)
- **Parallel Group**: Wave 2
- **Blocks**: 1.3
- **Blocked By**: 1.1

**References**:

- `src/core/animation/easing.ts` - Interpolation patterns
- `src/types/index.ts:Position` - Position type

**Acceptance Criteria**:

```bash
bun test src/core/animation/path.test.ts
# Expected: All tests pass

bun -e "import { createPath } from './src/core/animation/path'; const p = createPath([{x:0,y:0},{x:100,y:100}]); console.log(p.getPointAt(0.5))"
# Expected: { x: ~50, y: ~50 }
```

**Commit**: YES

- Message: `feat(animation): add path/motion animation system`
- Files: `src/core/animation/path.ts`, `src/core/animation/path.test.ts`

---

#### 1.3. Camera System

**What to do**:

- Implement virtual camera with pan, tilt, zoom, dolly, tracking
- Camera affects all layers (transform composition)
- Support camera keyframe animations
- Add camera presets (establishing shot, close-up, etc.)

**Must NOT do**:

- Require 3D engine (2D camera simulation)
- Break existing layer positioning

**Recommended Agent Profile**:

- **Category**: `ultrabrain`
- **Skills**: [`video-generation`]

**Parallelization**:

- **Can Run In Parallel**: YES (after 1.2)
- **Parallel Group**: Wave 2
- **Blocks**: Phase 2
- **Blocked By**: 1.1, 1.2

**References**:

- `src/core/engine/compositor.ts` - Layer composition (camera applies here)
- `src/core/animation/easing.ts` - For camera animation easing

**Acceptance Criteria**:

```bash
bun test src/core/animation/camera.test.ts
# Expected: All tests pass

bun -e "import { Camera } from './src/core/animation/camera'; const c = new Camera(); c.zoom(2); console.log(c.getTransform())"
# Expected: Transform matrix with 2x scale
```

**Commit**: YES

- Message: `feat(animation): add virtual camera system`
- Files: `src/core/animation/camera.ts`, `src/core/animation/camera.test.ts`

---

#### 1.4. Expand Transition Library (5 → 15+)

**What to do**:

- Add 10+ new transitions: iris, cube, clockWipe, blinds, flip, morph, glitch, pixelate, radialWipe, doorway
- Maintain existing transition API
- Add transition presets for cinematic use

**Must NOT do**:

- Break existing 5 transitions (fade, slide, zoom, dissolve, wipe)
- Require WebGL for transitions

**Recommended Agent Profile**:

- **Category**: `ultrabrain`
- **Skills**: [`video-generation`]

**Parallelization**:

- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 1 (with 1.1, 2.1)
- **Blocks**: None
- **Blocked By**: None

**References**:

- `src/core/animation/transitions.ts` - Existing transitions to extend
- `src/types/index.ts:Transition` - Transition type

**Acceptance Criteria**:

```bash
bun test src/core/animation/transitions.test.ts
# Expected: All tests pass

bun -e "import { transitions } from './src/core/animation/transitions'; console.log(Object.keys(transitions).length >= 15)"
# Expected: true
```

**Commit**: YES

- Message: `feat(animation): expand transition library to 15+ types`
- Files: `src/core/animation/transitions.ts`, `src/core/animation/transitions.test.ts`

---

### Phase 2: Audio & Storytelling

---

#### 2.1. TTS Provider Abstraction Layer

**What to do**:

- Create TTS provider interface
- Support multiple providers (HuggingFace, placeholder)
- Implement provider switching and fallback chain
- Add caching for generated audio

**Must NOT do**:

- Hardcode single provider
- Break existing audio mixer

**Recommended Agent Profile**:

- **Category**: `ultrabrain`
- **Skills**: [`video-generation`]

**Parallelization**:

- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 1 (with 1.1, 1.4)
- **Blocks**: 2.2, 2.3
- **Blocked By**: None

**References**:

- `src/core/audio/mixer.ts` - Existing audio system (placeholder TTS at lines 84-117)
- `src/types/index.ts:AudioTrack` - Audio type definitions (tts field at line 217)

**Acceptance Criteria**:

```bash
bun test src/core/audio/tts.test.ts
# Expected: All tests pass

bun -e "import { TTSProvider } from './src/core/audio/tts'; console.log(typeof TTSProvider)"
# Expected: function
```

**Commit**: YES

- Message: `feat(audio): add TTS provider abstraction layer`
- Files: `src/core/audio/tts.ts`, `src/core/audio/providers/index.ts`, `src/core/audio/tts.test.ts`

---

#### 2.2. HuggingFace TTS Integration

**What to do**:

- Implement HuggingFace TTS provider using `@gradio/client`
- Support Qwen3-TTS (primary) and Chatterbox (fallback)
- Handle cold starts, rate limits, retries
- Support voice selection and emotion control

**Must NOT do**:

- Expose HF tokens in logs
- Fail silently on errors
- Block on cold starts without timeout

**Recommended Agent Profile**:

- **Category**: `ultrabrain`
- **Skills**: [`video-generation`]

**Parallelization**:

- **Can Run In Parallel**: YES (after 2.1)
- **Parallel Group**: Wave 2
- **Blocks**: 4.1
- **Blocked By**: 2.1

**References**:

- `src/core/audio/tts.ts` - TTS abstraction (from 2.1)
- HuggingFace Qwen3-TTS: https://huggingface.co/spaces/Qwen/Qwen3-TTS
- HuggingFace Chatterbox: https://huggingface.co/spaces/ResembleAI/Chatterbox-Multilingual-TTS
- Gradio JS Client: https://www.npmjs.com/package/@gradio/client

**Acceptance Criteria**:

```bash
bun test src/core/audio/providers/huggingface.test.ts
# Expected: All tests pass (mocked API)

# Integration test (requires HF_TOKEN for private spaces)
HF_TOKEN=test bun -e "import { HuggingFaceTTS } from './src/core/audio/providers/huggingface'; console.log(typeof HuggingFaceTTS)"
# Expected: function
```

**Commit**: YES

- Message: `feat(audio): add HuggingFace TTS provider (Qwen3-TTS, Chatterbox)`
- Files: `src/core/audio/providers/huggingface.ts`, `src/core/audio/providers/huggingface.test.ts`, `package.json`

---

#### 2.3. Audio Visualization Engine

**What to do**:

- Implement waveform visualization
- Implement frequency bar visualization
- Support customizable visualization styles
- Integrate with layer system

**Must NOT do**:

- Require real-time audio processing
- Use Web Audio API (Node.js only)

**Recommended Agent Profile**:

- **Category**: `ultrabrain`
- **Skills**: [`video-generation`]

**Parallelization**:

- **Can Run In Parallel**: YES (after 2.1)
- **Parallel Group**: Wave 2
- **Blocks**: 2.4
- **Blocked By**: 2.1

**References**:

- `src/core/audio/mixer.ts` - Audio data access
- `src/core/engine/renderer.ts` - Rendering integration

**Acceptance Criteria**:

```bash
bun test src/core/audio/visualization.test.ts
# Expected: All tests pass

bun -e "import { AudioVisualizer } from './src/core/audio/visualization'; console.log(typeof AudioVisualizer)"
# Expected: function
```

**Commit**: YES

- Message: `feat(audio): add audio visualization engine`
- Files: `src/core/audio/visualization.ts`, `src/core/audio/visualization.test.ts`

---

#### 2.4. Beat Detection System

**What to do**:

- Implement beat/tempo detection from audio
- Generate beat markers for sync
- Support auto-pacing based on beats
- Export beat data for animation triggers

**Must NOT do**:

- Require real-time processing
- Use heavy ML models

**Recommended Agent Profile**:

- **Category**: `ultrabrain`
- **Skills**: [`video-generation`]

**Parallelization**:

- **Can Run In Parallel**: YES (after 2.3)
- **Parallel Group**: Wave 3
- **Blocks**: 4.2
- **Blocked By**: 2.3

**References**:

- `src/core/audio/visualization.ts` - Audio analysis foundation
- FFmpeg audio analysis capabilities

**Acceptance Criteria**:

```bash
bun test src/core/audio/beat-detection.test.ts
# Expected: All tests pass

bun -e "import { detectBeats } from './src/core/audio/beat-detection'; console.log(typeof detectBeats)"
# Expected: function
```

**Commit**: YES

- Message: `feat(audio): add beat detection system`
- Files: `src/core/audio/beat-detection.ts`, `src/core/audio/beat-detection.test.ts`

---

### Phase 3: 3D Graphics Integration

---

#### 3.1. Three.js Integration Foundation

**What to do**:

- Add Three.js as dependency
- Create 3D scene abstraction
- Implement headless rendering setup (node-canvas + gl)
- Define 3D layer type in schema

**Must NOT do**:

- Require browser/DOM
- Make 3D mandatory for basic videos

**Recommended Agent Profile**:

- **Category**: `ultrabrain`
- **Skills**: [`video-generation`]

**Parallelization**:

- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 3
- **Blocks**: 3.2, 3.3, 3.4
- **Blocked By**: Phase 1 complete

**References**:

- `src/core/engine/renderer.ts` - Rendering pipeline
- `src/types/index.ts:Layer` - Layer type to extend
- Three.js: https://threejs.org/docs/

**Acceptance Criteria**:

```bash
bun test src/core/3d/scene.test.ts
# Expected: All tests pass

bun -e "import * as THREE from 'three'; console.log(THREE.REVISION)"
# Expected: Three.js version number
```

**Commit**: YES

- Message: `feat(3d): add Three.js integration foundation`
- Files: `src/core/3d/scene.ts`, `src/core/3d/scene.test.ts`, `package.json`

---

#### 3.2. GPU Renderer (WebGL)

**What to do**:

- Implement WebGL renderer using headless-gl
- Support GPU-accelerated 3D rendering
- Detect GPU availability
- Graceful fallback to CPU

**Must NOT do**:

- Crash if no GPU available
- Require specific GPU vendor

**Recommended Agent Profile**:

- **Category**: `ultrabrain`
- **Skills**: [`video-generation`]

**Parallelization**:

- **Can Run In Parallel**: YES (after 3.1)
- **Parallel Group**: Wave 4
- **Blocks**: 4.2
- **Blocked By**: 3.1

**References**:

- `src/core/3d/scene.ts` - 3D scene foundation
- headless-gl: https://github.com/stackgl/headless-gl

**Acceptance Criteria**:

```bash
bun test src/core/3d/gpu-renderer.test.ts
# Expected: All tests pass (may skip on no-GPU systems)

bun -e "import { GPURenderer } from './src/core/3d/gpu-renderer'; console.log(GPURenderer.isAvailable())"
# Expected: true or false (no crash)
```

**Commit**: YES

- Message: `feat(3d): add GPU renderer with WebGL support`
- Files: `src/core/3d/gpu-renderer.ts`, `src/core/3d/gpu-renderer.test.ts`

---

#### 3.3. CPU Fallback Renderer

**What to do**:

- Implement software renderer for 3D
- Use Three.js SoftwareRenderer or custom
- Ensure visual parity with GPU renderer
- Optimize for reasonable performance

**Must NOT do**:

- Produce different output than GPU
- Be unusably slow (target: 1 FPS minimum)

**Recommended Agent Profile**:

- **Category**: `ultrabrain`
- **Skills**: [`video-generation`]

**Parallelization**:

- **Can Run In Parallel**: YES (after 3.1)
- **Parallel Group**: Wave 4
- **Blocks**: 4.2
- **Blocked By**: 3.1

**References**:

- `src/core/3d/scene.ts` - 3D scene foundation
- `src/core/3d/gpu-renderer.ts` - API parity reference

**Acceptance Criteria**:

```bash
bun test src/core/3d/cpu-renderer.test.ts
# Expected: All tests pass

bun -e "import { CPURenderer } from './src/core/3d/cpu-renderer'; const r = new CPURenderer(100,100); console.log(r.render !== undefined)"
# Expected: true
```

**Commit**: YES

- Message: `feat(3d): add CPU fallback renderer for 3D scenes`
- Files: `src/core/3d/cpu-renderer.ts`, `src/core/3d/cpu-renderer.test.ts`

---

#### 3.4. GLTF Model Support

**What to do**:

- Add GLTF/GLB model loading
- Support animations in GLTF
- Integrate with 3D scene system
- Add model caching

**Must NOT do**:

- Support all GLTF extensions (core only)
- Load models synchronously

**Recommended Agent Profile**:

- **Category**: `ultrabrain`
- **Skills**: [`video-generation`]

**Parallelization**:

- **Can Run In Parallel**: YES (after 3.1)
- **Parallel Group**: Wave 4
- **Blocks**: 4.2
- **Blocked By**: 3.1

**References**:

- `src/core/3d/scene.ts` - 3D scene system
- Three.js GLTFLoader: https://threejs.org/docs/#examples/en/loaders/GLTFLoader

**Acceptance Criteria**:

```bash
bun test src/core/3d/gltf-loader.test.ts
# Expected: All tests pass

bun -e "import { loadGLTF } from './src/core/3d/gltf-loader'; console.log(typeof loadGLTF)"
# Expected: function
```

**Commit**: YES

- Message: `feat(3d): add GLTF/GLB model loading support`
- Files: `src/core/3d/gltf-loader.ts`, `src/core/3d/gltf-loader.test.ts`

---

### Phase 4: LLM-Native Enhancement

---

#### 4.1. MCP Tool Expansion (Batch 1: 8 → 14)

**What to do**:

- Add tools: `add_spring_animation`, `add_camera_movement`, `add_path_animation`, `set_transition`, `add_audio_visualization`, `generate_tts`
- Follow existing MCP tool patterns
- Add comprehensive tool descriptions for LLM

**Must NOT do**:

- Break existing 8 tools
- Use inconsistent naming

**Recommended Agent Profile**:

- **Category**: `ultrabrain`
- **Skills**: [`video-generation`]

**Parallelization**:

- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 3
- **Blocks**: 4.2
- **Blocked By**: Phase 1, 2.1-2.2

**References**:

- `src/mcp/server.ts` - Existing MCP server
- `src/mcp/tools/` - Existing tool implementations (if any)

**Acceptance Criteria**:

```bash
bun test src/mcp/**/*.test.ts
# Expected: All tests pass

bun -e "import { server } from './src/mcp/server'; console.log(server.tools.length >= 14)"
# Expected: true
```

**Commit**: YES

- Message: `feat(mcp): expand MCP tools from 8 to 14`
- Files: `src/mcp/tools/*.ts`, `src/mcp/server.ts`

---

#### 4.2. MCP Tool Expansion (Batch 2: 14 → 20+)

**What to do**:

- Add tools: `add_3d_scene`, `load_gltf_model`, `add_particles`, `add_lottie`, `detect_beats`, `auto_pace_to_audio`, `describe_video`, `apply_template`, `add_video_layer`
- Add advanced composition tools
- Add preset/template tools

**Must NOT do**:

- Duplicate functionality
- Create overly complex tool signatures

**Recommended Agent Profile**:

- **Category**: `ultrabrain`
- **Skills**: [`video-generation`]

**Parallelization**:

- **Can Run In Parallel**: YES (after 4.1)
- **Parallel Group**: Wave 4
- **Blocks**: 4.3, 4.4
- **Blocked By**: 4.1, Phase 3

**References**:

- `src/mcp/server.ts` - MCP server
- Phase 3 implementations for 3D tools

**Acceptance Criteria**:

```bash
bun test src/mcp/**/*.test.ts
# Expected: All tests pass

bun -e "import { server } from './src/mcp/server'; console.log(server.tools.length >= 20)"
# Expected: true
```

**Commit**: YES

- Message: `feat(mcp): expand MCP tools to 20+`
- Files: `src/mcp/tools/*.ts`, `src/mcp/server.ts`

---

#### 4.3. Copilot SDK Integration

**What to do**:

- Research Copilot SDK patterns
- Implement Copilot-compatible interface
- Update Copilot skill definition
- Test with Copilot agent

**Must NOT do**:

- Break MCP compatibility
- Require Copilot for basic usage

**Recommended Agent Profile**:

- **Category**: `ultrabrain`
- **Skills**: [`video-generation`]

**Parallelization**:

- **Can Run In Parallel**: YES (after 4.2)
- **Parallel Group**: Wave 5
- **Blocks**: None
- **Blocked By**: 4.2

**References**:

- `skills/copilot/` - Existing Copilot skill
- Copilot SDK documentation

**Acceptance Criteria**:

```bash
# Verify skill file is valid JSON
bun -e "const skill = require('./skills/copilot/autovid.json'); console.log(skill.name !== undefined)"
# Expected: true

bun test src/integrations/copilot.test.ts
# Expected: All tests pass
```

**Commit**: YES

- Message: `feat(integration): add Copilot SDK integration`
- Files: `skills/copilot/*.json`, `src/integrations/copilot.ts`

---

#### 4.4. Natural Language Video API

**What to do**:

- Implement NL-to-video-spec translation
- Support common video descriptions
- Add style/mood inference
- Integrate with existing schema

**Must NOT do**:

- Require external LLM API call (pattern matching only)
- Replace structured API

**Recommended Agent Profile**:

- **Category**: `ultrabrain`
- **Skills**: [`video-generation`]

**Parallelization**:

- **Can Run In Parallel**: YES (after 4.2)
- **Parallel Group**: Wave 5
- **Blocks**: None
- **Blocked By**: 4.2

**References**:

- `src/types/index.ts` - Schema types
- `src/core/storytelling/` - Story structure patterns

**Acceptance Criteria**:

```bash
bun test src/api/natural-language.test.ts
# Expected: All tests pass

bun -e "import { parseNaturalLanguage } from './src/api/natural-language'; console.log(typeof parseNaturalLanguage)"
# Expected: function
```

**Commit**: YES

- Message: `feat(api): add natural language video specification API`
- Files: `src/api/natural-language.ts`, `src/api/natural-language.test.ts`

---

### Phase 5: Advanced Features

---

#### 5.1. Particle System

**What to do**:

- Implement particle emitter system
- Support presets: snow, confetti, fire, smoke, sparks
- Add particle physics (gravity, wind)
- Integrate with layer system

**Must NOT do**:

- Require GPU for particles
- Create performance issues (limit particle count)

**Recommended Agent Profile**:

- **Category**: `ultrabrain`
- **Skills**: [`video-generation`]

**Parallelization**:

- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 5
- **Blocks**: 6.x
- **Blocked By**: Phase 3

**References**:

- `src/core/engine/renderer.ts` - Rendering integration
- `src/core/effects/visual.ts` - Effects pattern

**Acceptance Criteria**:

```bash
bun test src/core/effects/particles.test.ts
# Expected: All tests pass

bun -e "import { ParticleEmitter } from './src/core/effects/particles'; const e = new ParticleEmitter('snow'); console.log(e.particles !== undefined)"
# Expected: true
```

**Commit**: YES

- Message: `feat(effects): add particle system with presets`
- Files: `src/core/effects/particles.ts`, `src/core/effects/particles.test.ts`

---

#### 5.2. Lottie Animation Support

**What to do**:

- Add Lottie JSON parsing
- Implement Lottie-to-frame rendering
- Support Lottie layer type
- Handle Lottie timing/looping

**Must NOT do**:

- Require After Effects
- Support all Lottie features (core subset)

**Recommended Agent Profile**:

- **Category**: `ultrabrain`
- **Skills**: [`video-generation`]

**Parallelization**:

- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 5
- **Blocks**: 6.x
- **Blocked By**: Phase 1

**References**:

- `src/core/engine/renderer.ts` - Layer rendering
- `src/types/index.ts:Layer` - Layer type to extend
- lottie-web/lottie-node: https://github.com/nicolo-ribaudo/lottie-node

**Acceptance Criteria**:

```bash
bun test src/core/effects/lottie.test.ts
# Expected: All tests pass

bun -e "import { LottieRenderer } from './src/core/effects/lottie'; console.log(typeof LottieRenderer)"
# Expected: function
```

**Commit**: YES

- Message: `feat(effects): add Lottie animation support`
- Files: `src/core/effects/lottie.ts`, `src/core/effects/lottie.test.ts`

---

### Phase 6: Video Layer (LAST)

---

#### 6.1. Video Decoding

**What to do**:

- Implement video file reading via FFmpeg
- Extract frames at specified times
- Support common formats (MP4, WebM, MOV)
- Handle video metadata (duration, fps, resolution)

**Must NOT do**:

- Decode entire video into memory
- Require specific codecs

**Recommended Agent Profile**:

- **Category**: `ultrabrain`
- **Skills**: [`video-generation`]

**Parallelization**:

- **Can Run In Parallel**: YES
- **Parallel Group**: Wave 6
- **Blocks**: 6.2, 6.3
- **Blocked By**: All previous phases

**References**:

- `src/core/engine/ffmpeg.ts` - Existing FFmpeg integration
- `src/core/layers/video.ts` - Placeholder to replace

**Acceptance Criteria**:

```bash
bun test src/core/layers/video.test.ts
# Expected: All tests pass

bun -e "import { VideoDecoder } from './src/core/layers/video'; console.log(typeof VideoDecoder)"
# Expected: function
```

**Commit**: YES

- Message: `feat(video): add video decoding support`
- Files: `src/core/layers/video.ts`, `src/core/layers/video.test.ts`

---

#### 6.2. Video Compositing

**What to do**:

- Integrate video frames into compositor
- Support video layer positioning, scaling, opacity
- Handle video timing (start, end, speed)
- Support video looping

**Must NOT do**:

- Break existing compositor
- Require video re-encoding for simple operations

**Recommended Agent Profile**:

- **Category**: `ultrabrain`
- **Skills**: [`video-generation`]

**Parallelization**:

- **Can Run In Parallel**: YES (after 6.1)
- **Parallel Group**: Wave 6
- **Blocks**: 6.4
- **Blocked By**: 6.1

**References**:

- `src/core/engine/compositor.ts` - Compositor to extend
- `src/core/layers/video.ts` - Video decoder (from 6.1)

**Acceptance Criteria**:

```bash
bun test src/core/engine/compositor.test.ts
# Expected: All tests pass including video layer tests
```

**Commit**: YES

- Message: `feat(video): add video layer compositing`
- Files: `src/core/engine/compositor.ts`, `src/core/engine/compositor.test.ts`

---

#### 6.3. Video Textures (3D)

**What to do**:

- Support video as texture in 3D scenes
- Sync video playback with 3D animation
- Handle video texture updates per frame

**Must NOT do**:

- Require GPU for video textures
- Create memory leaks

**Recommended Agent Profile**:

- **Category**: `ultrabrain`
- **Skills**: [`video-generation`]

**Parallelization**:

- **Can Run In Parallel**: YES (after 6.1)
- **Parallel Group**: Wave 6
- **Blocks**: 6.4
- **Blocked By**: 6.1, Phase 3

**References**:

- `src/core/3d/scene.ts` - 3D scene system
- `src/core/layers/video.ts` - Video decoder

**Acceptance Criteria**:

```bash
bun test src/core/3d/video-texture.test.ts
# Expected: All tests pass
```

**Commit**: YES

- Message: `feat(3d): add video texture support for 3D scenes`
- Files: `src/core/3d/video-texture.ts`, `src/core/3d/video-texture.test.ts`

---

#### 6.4. Integration Testing & Documentation

**What to do**:

- Run full integration tests
- Update all documentation
- Create migration guide from placeholder
- Add video layer examples
- Update README, ARCHITECTURE.md

**Must NOT do**:

- Skip backward compatibility tests
- Leave outdated documentation

**Recommended Agent Profile**:

- **Category**: `writing`
- **Skills**: [`video-generation`]

**Parallelization**:

- **Can Run In Parallel**: NO (final task)
- **Parallel Group**: Wave 6 (last)
- **Blocks**: None
- **Blocked By**: 6.1, 6.2, 6.3

**References**:

- All previous implementations
- `README.md`, `docs/`, `ARCHITECTURE.md`

**Acceptance Criteria**:

```bash
# Run all tests
bun test
# Expected: All tests pass (18 existing + new)

# Verify documentation updated
grep -l "video layer" docs/*.md README.md | wc -l
# Expected: At least 2
```

**Commit**: YES

- Message: `docs: update documentation for video layer and all new features`
- Files: `README.md`, `docs/*.md`, `examples/video-*.json`, `ARCHITECTURE.md`

---

## Documentation & Handoff Deliverables

### Per-Phase Deliverables

| Phase | Code                           | Tests                        | Docs                   | Examples                           |
| ----- | ------------------------------ | ---------------------------- | ---------------------- | ---------------------------------- |
| **1** | animation/\*.ts                | animation/\*.test.ts         | Animation.md           | spring-demo.json, camera-demo.json |
| **2** | audio/_.ts, providers/_.ts     | audio/\*.test.ts             | Audio.md, TTS.md       | tts-demo.json, audio-viz.json      |
| **3** | 3d/\*.ts                       | 3d/\*.test.ts                | 3D.md                  | 3d-scene.json, gltf-model.json     |
| **4** | mcp/tools/_.ts, api/_.ts       | mcp/_.test.ts, api/_.test.ts | MCP.md, API.md         | Updated skills/                    |
| **5** | effects/\*.ts                  | effects/\*.test.ts           | Effects.md             | particles.json, lottie.json        |
| **6** | layers/video.ts, compositor.ts | Full integration             | VIDEO.md, Migration.md | video-layer.json                   |

### Final Deliverables

- [ ] Updated `README.md` with all new features
- [ ] Updated `ARCHITECTURE.md` with new modules
- [ ] New `docs/TTS.md` - TTS provider documentation
- [ ] New `docs/3D.md` - 3D rendering guide
- [ ] New `docs/MCP-TOOLS.md` - Complete MCP tool reference
- [ ] Updated `skills/` for Claude, Copilot, OpenCode
- [ ] Migration guide from v1 to v2

---

## Distributed Rendering (DEFERRED - Phase 7+)

### Scope Assessment

| Aspect           | Estimate                                      |
| ---------------- | --------------------------------------------- |
| **Difficulty**   | HIGH - requires distributed systems expertise |
| **Cost**         | $$$$ - cloud compute, orchestration, storage  |
| **Time**         | 4-8 weeks additional development              |
| **Dependencies** | Core rendering must be stable first           |

### Why Deferred

1. **Complexity**: Job splitting, frame distribution, result aggregation
2. **Infrastructure**: Queue system (Redis/RabbitMQ), storage (S3), orchestrator
3. **Cost**: Lambda/Cloud Run compute costs scale with video length
4. **Testing**: Requires distributed test infrastructure
5. **Not Blocking**: Current rendering works for typical video lengths (<10 min)

### Future Phase 7+ Scope (Notes)

```
- AWS Lambda integration (Remotion-style)
- Worker pool management
- Frame chunk distribution (N frames per worker)
- Result aggregation and assembly
- Progress reporting across workers
- Cost estimation tool
- Auto-scaling based on queue depth
- Failure recovery and retry logic
```

---

## GitHub Issues Breakdown

### Milestone: v2.0 - Remotion Competitor

```
📁 Milestone: v2.0 - Remotion Competitor
│
├── 📋 Epic: Phase 1 - Animation Engine
│   ├── #1: [feat] Spring physics animation system
│   │   Labels: phase-1, animation, priority-high
│   │   Estimate: 2-3 days
│   │
│   ├── #2: [feat] Path/motion animation system
│   │   Labels: phase-1, animation, priority-high
│   │   Blocked by: #1
│   │   Estimate: 2 days
│   │
│   ├── #3: [feat] Virtual camera system
│   │   Labels: phase-1, animation, priority-high
│   │   Blocked by: #1, #2
│   │   Estimate: 2-3 days
│   │
│   └── #4: [feat] Expand transitions (5→15+)
│       Labels: phase-1, animation, priority-medium
│       Estimate: 2 days
│
├── 📋 Epic: Phase 2 - Audio & Storytelling
│   ├── #5: [feat] TTS provider abstraction layer
│   │   Labels: phase-2, audio, priority-high
│   │   Estimate: 1-2 days
│   │
│   ├── #6: [feat] HuggingFace TTS integration
│   │   Labels: phase-2, audio, huggingface, priority-high
│   │   Blocked by: #5
│   │   Estimate: 3-4 days
│   │
│   ├── #7: [feat] Audio visualization engine
│   │   Labels: phase-2, audio, priority-medium
│   │   Blocked by: #5
│   │   Estimate: 2-3 days
│   │
│   └── #8: [feat] Beat detection system
│       Labels: phase-2, audio, priority-medium
│       Blocked by: #7
│       Estimate: 2 days
│
├── 📋 Epic: Phase 3 - 3D Graphics
│   ├── #9: [feat] Three.js integration foundation
│   │   Labels: phase-3, 3d, priority-high
│   │   Blocked by: Phase 1 complete
│   │   Estimate: 3-4 days
│   │
│   ├── #10: [feat] GPU renderer (WebGL)
│   │   Labels: phase-3, 3d, gpu, priority-high
│   │   Blocked by: #9
│   │   Estimate: 2-3 days
│   │
│   ├── #11: [feat] CPU fallback renderer
│   │   Labels: phase-3, 3d, priority-high
│   │   Blocked by: #9
│   │   Estimate: 2-3 days
│   │
│   └── #12: [feat] GLTF model support
│       Labels: phase-3, 3d, priority-medium
│       Blocked by: #9
│       Estimate: 2 days
│
├── 📋 Epic: Phase 4 - LLM-Native
│   ├── #13: [feat] MCP tools expansion (8→14)
│   │   Labels: phase-4, mcp, llm, priority-high
│   │   Blocked by: Phase 1, #5, #6
│   │   Estimate: 2-3 days
│   │
│   ├── #14: [feat] MCP tools expansion (14→20+)
│   │   Labels: phase-4, mcp, llm, priority-high
│   │   Blocked by: #13, Phase 3
│   │   Estimate: 2-3 days
│   │
│   ├── #15: [feat] Copilot SDK integration
│   │   Labels: phase-4, copilot, llm, priority-medium
│   │   Blocked by: #14
│   │   Estimate: 2 days
│   │
│   └── #16: [feat] Natural language video API
│       Labels: phase-4, api, llm, priority-medium
│       Blocked by: #14
│       Estimate: 2-3 days
│
├── 📋 Epic: Phase 5 - Advanced Features
│   ├── #17: [feat] Particle system with presets
│   │   Labels: phase-5, effects, priority-medium
│   │   Blocked by: Phase 3
│   │   Estimate: 2-3 days
│   │
│   └── #18: [feat] Lottie animation support
│       Labels: phase-5, effects, priority-medium
│       Blocked by: Phase 1
│       Estimate: 2-3 days
│
└── 📋 Epic: Phase 6 - Video Layer (LAST)
    ├── #19: [feat] Video decoding
    │   Labels: phase-6, video, priority-high
    │   Blocked by: All previous phases
    │   Estimate: 3-4 days
    │
    ├── #20: [feat] Video layer compositing
    │   Labels: phase-6, video, priority-high
    │   Blocked by: #19
    │   Estimate: 2-3 days
    │
    ├── #21: [feat] Video textures for 3D
    │   Labels: phase-6, video, 3d, priority-medium
    │   Blocked by: #19, Phase 3
    │   Estimate: 2 days
    │
    └── #22: [docs] Integration testing & documentation
        Labels: phase-6, docs, priority-high
        Blocked by: #19, #20, #21
        Estimate: 2-3 days
```

### Issue Template

````markdown
## Summary

[Brief description of the task]

## Task Details

**What to do:**

- [ ] Step 1
- [ ] Step 2

**Must NOT do:**

- Constraint 1
- Constraint 2

## References

- `src/path/to/file.ts` - Description
- External: URL - Description

## Dependencies

- **Blocked by:** #issue-number
- **Blocks:** #issue-number

## Acceptance Criteria

```bash
# Verification command
bun test src/[module].test.ts
# Expected: All tests pass
```
````

## Agent Hints

- **Category:** ultrabrain | visual-engineering | writing
- **Skills:** video-generation
- **Parallel:** YES | NO
- **Estimated effort:** X days

```

---

## Commit Strategy

| Phase | Task | Commit Message | Key Files |
|-------|------|----------------|-----------|
| 1 | 1.1 | `feat(animation): add spring physics animation system` | spring.ts |
| 1 | 1.2 | `feat(animation): add path/motion animation system` | path.ts |
| 1 | 1.3 | `feat(animation): add virtual camera system` | camera.ts |
| 1 | 1.4 | `feat(animation): expand transition library to 15+ types` | transitions.ts |
| 2 | 2.1 | `feat(audio): add TTS provider abstraction layer` | tts.ts |
| 2 | 2.2 | `feat(audio): add HuggingFace TTS provider` | providers/huggingface.ts |
| 2 | 2.3 | `feat(audio): add audio visualization engine` | visualization.ts |
| 2 | 2.4 | `feat(audio): add beat detection system` | beat-detection.ts |
| 3 | 3.1 | `feat(3d): add Three.js integration foundation` | 3d/scene.ts |
| 3 | 3.2 | `feat(3d): add GPU renderer with WebGL support` | 3d/gpu-renderer.ts |
| 3 | 3.3 | `feat(3d): add CPU fallback renderer` | 3d/cpu-renderer.ts |
| 3 | 3.4 | `feat(3d): add GLTF/GLB model loading` | 3d/gltf-loader.ts |
| 4 | 4.1 | `feat(mcp): expand MCP tools from 8 to 14` | mcp/tools/*.ts |
| 4 | 4.2 | `feat(mcp): expand MCP tools to 20+` | mcp/tools/*.ts |
| 4 | 4.3 | `feat(integration): add Copilot SDK integration` | integrations/copilot.ts |
| 4 | 4.4 | `feat(api): add natural language video API` | api/natural-language.ts |
| 5 | 5.1 | `feat(effects): add particle system with presets` | effects/particles.ts |
| 5 | 5.2 | `feat(effects): add Lottie animation support` | effects/lottie.ts |
| 6 | 6.1 | `feat(video): add video decoding support` | layers/video.ts |
| 6 | 6.2 | `feat(video): add video layer compositing` | engine/compositor.ts |
| 6 | 6.3 | `feat(3d): add video texture support for 3D scenes` | 3d/video-texture.ts |
| 6 | 6.4 | `docs: update documentation for video layer and all new features` | README.md, docs/ |
```
