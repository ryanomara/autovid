import { writeFile, readFile, mkdir, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { logger } from './logger.js';
import type { MemoryState, RenderProgress, VideoConfig } from '../types/index.js';

export interface MemoryOptions {
  projectId: string;
  workDir?: string;
}

export class MemoryManager {
  private projectId: string;
  private memoryDir: string;

  constructor(options: MemoryOptions) {
    this.projectId = options.projectId;
    this.memoryDir = options.workDir || join(process.cwd(), '.autovid', 'memory', this.projectId);
  }

  async init(): Promise<void> {
    if (!existsSync(this.memoryDir)) {
      await mkdir(this.memoryDir, { recursive: true });
      logger.info({ memoryDir: this.memoryDir }, 'Initialized memory directory');
    }
  }

  async saveState(state: Partial<MemoryState>): Promise<void> {
    await this.init();

    const existing = await this.loadState().catch(() => this.createEmptyState());
    const updated: MemoryState = { ...existing, ...state, timestamp: Date.now() };

    const statePath = join(this.memoryDir, 'state.json');
    await writeFile(statePath, JSON.stringify(updated, null, 2), 'utf-8');

    logger.debug({ projectId: this.projectId }, 'Saved memory state');
  }

  async loadState(): Promise<MemoryState> {
    const statePath = join(this.memoryDir, 'state.json');

    if (!existsSync(statePath)) {
      throw new Error(`No saved state found for project: ${this.projectId}`);
    }

    const content = await readFile(statePath, 'utf-8');
    return JSON.parse(content) as MemoryState;
  }

  async hasState(): Promise<boolean> {
    const statePath = join(this.memoryDir, 'state.json');
    return existsSync(statePath);
  }

  async saveProgress(progress: RenderProgress): Promise<void> {
    await this.saveState({ progress });
  }

  async saveRenderedFrames(frames: number[]): Promise<void> {
    await this.saveState({ renderedFrames: frames });
  }

  async saveRenderedScenes(scenes: string[]): Promise<void> {
    await this.saveState({ renderedScenes: scenes });
  }

  async saveAssetCache(cache: Record<string, string>): Promise<void> {
    await this.saveState({ assetCache: cache });
  }

  async clear(): Promise<void> {
    if (existsSync(this.memoryDir)) {
      await rm(this.memoryDir, { recursive: true, force: true });
      logger.info({ projectId: this.projectId }, 'Cleared memory state');
    }
  }

  getMemoryDir(): string {
    return this.memoryDir;
  }

  private createEmptyState(): MemoryState {
    return {
      projectId: this.projectId,
      timestamp: Date.now(),
      renderedFrames: [],
      renderedScenes: [],
      assetCache: {},
      progress: {
        frame: 0,
        totalFrames: 0,
        percentage: 0,
      },
      config: {
        width: 1920,
        height: 1080,
        fps: 30,
        duration: 0,
        outputFormat: 'mp4',
      },
    };
  }

  static async listProjects(workDir?: string): Promise<string[]> {
    const baseDir = workDir || join(process.cwd(), '.autovid', 'memory');

    if (!existsSync(baseDir)) {
      return [];
    }

    const { readdir } = await import('fs/promises');
    return readdir(baseDir);
  }

  static async deleteProject(projectId: string, workDir?: string): Promise<void> {
    const memoryDir = workDir || join(process.cwd(), '.autovid', 'memory', projectId);

    if (existsSync(memoryDir)) {
      await rm(memoryDir, { recursive: true, force: true });
      logger.info({ projectId }, 'Deleted project memory');
    }
  }
}
