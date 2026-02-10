import { spawn } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { createLogger } from '../../utils/logger.js';
import type { AudioTrack, VideoConfig } from '../../types/index.js';
import { TTSService, PlaceholderTTSProvider } from './tts.js';
import { HuggingFaceTTSProvider } from './providers/huggingface.js';

const logger = createLogger('audio-mixer');

export interface AudioMixerOptions {
  outputPath: string;
  config: VideoConfig;
  tracks: AudioTrack[];
  tempDir?: string;
}

export class AudioMixer {
  private tempDir: string;

  constructor(tempDir?: string) {
    this.tempDir = tempDir || '/tmp/autovid-audio';
  }

  async mix(options: AudioMixerOptions): Promise<string> {
    const { outputPath, config, tracks } = options;

    if (tracks.length === 0) {
      logger.info('No audio tracks to mix');
      return '';
    }

    logger.info({ trackCount: tracks.length }, 'Mixing audio tracks');

    const processedTracks: string[] = [];

    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];

      try {
        if (track.tts) {
          const ttsPath = await this.generateTTS(track, i);
          processedTracks.push(ttsPath);
        } else if (track.src) {
          const processedPath = await this.processAudioTrack(track, i, config);
          processedTracks.push(processedPath);
        }
      } catch (error) {
        logger.error({ trackId: track.id, error }, 'Failed to process track');
      }
    }

    if (processedTracks.length === 0) {
      logger.warn('No tracks were successfully processed');
      return '';
    }

    const mixedPath = await this.mixTracks(processedTracks, outputPath, config);

    await this.cleanup(processedTracks);

    logger.info({ outputPath: mixedPath }, 'Audio mixing complete');
    return mixedPath;
  }

  private async generateTTS(track: AudioTrack, index: number): Promise<string> {
    if (!track.tts) {
      throw new Error('TTS config missing');
    }

    const outputPath = join(this.tempDir, `tts_${index}.mp3`);

    logger.info(
      { text: track.tts.text.substring(0, 50), voice: track.tts.voice },
      'Generating TTS'
    );

    const ttsService = new TTSService({
      providers: [
        new HuggingFaceTTSProvider({
          token: process.env.HF_TOKEN,
        }),
        new PlaceholderTTSProvider(),
      ],
      fallbackOrder: ['huggingface', 'placeholder'],
    });

    await ttsService.synthesize(track, outputPath);

    return outputPath;
  }

  private async processAudioTrack(
    track: AudioTrack,
    index: number,
    config: VideoConfig
  ): Promise<string> {
    if (!track.src) {
      throw new Error('Audio src missing');
    }

    if (!existsSync(track.src)) {
      throw new Error(`Audio file not found: ${track.src}`);
    }

    const outputPath = join(this.tempDir, `track_${index}.mp3`);
    const duration = config.duration / 1000;

    const filters: string[] = [];

    if (track.volume !== 1.0) {
      filters.push(`volume=${track.volume}`);
    }

    if (track.fadeIn) {
      filters.push(`afade=t=in:st=${track.startTime / 1000}:d=${track.fadeIn / 1000}`);
    }

    if (track.fadeOut) {
      const fadeStart = (track.endTime - track.fadeOut) / 1000;
      filters.push(`afade=t=out:st=${fadeStart}:d=${track.fadeOut / 1000}`);
    }

    const args = [
      '-i',
      track.src,
      '-ss',
      `${track.startTime / 1000}`,
      '-t',
      `${(track.endTime - track.startTime) / 1000}`,
    ];

    if (filters.length > 0) {
      args.push('-af', filters.join(','));
    }

    if (track.loop) {
      args.push('-stream_loop', '-1');
    }

    args.push('-y', outputPath);

    await this.runFFmpeg(args);

    return outputPath;
  }

  private async mixTracks(
    trackPaths: string[],
    outputPath: string,
    config: VideoConfig
  ): Promise<string> {
    const inputs = trackPaths.flatMap((path) => ['-i', path]);

    const filterComplex =
      trackPaths.map((_, i) => `[${i}:a]`).join('') +
      `amix=inputs=${trackPaths.length}:duration=longest[out]`;

    const args = [
      ...inputs,
      '-filter_complex',
      filterComplex,
      '-map',
      '[out]',
      '-t',
      `${config.duration / 1000}`,
      '-y',
      outputPath,
    ];

    await this.runFFmpeg(args);

    return outputPath;
  }

  private runFFmpeg(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', args);

      let stderr = '';

      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          logger.error({ stderr }, 'FFmpeg error');
          reject(new Error(`FFmpeg failed with code ${code}`));
        }
      });

      ffmpeg.on('error', reject);
    });
  }

  private async cleanup(paths: string[]): Promise<void> {
    for (const path of paths) {
      try {
        if (existsSync(path)) {
          await unlink(path);
        }
      } catch (error) {
        logger.warn({ path, error }, 'Failed to cleanup temp file');
      }
    }
  }
}

export async function mixAudio(options: AudioMixerOptions): Promise<string> {
  const mixer = new AudioMixer(options.tempDir);
  return mixer.mix(options);
}
