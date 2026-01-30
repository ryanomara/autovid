import { execa } from 'execa';
import { logger } from '../../utils/logger.js';
import type { VideoConfig, RenderOptions, RenderProgress } from '../../types/index.js';
import { existsSync, mkdirSync, readdirSync, writeFileSync, readFileSync, appendFileSync, unlinkSync } from 'fs';
import { dirname, join } from 'path';

export interface FFmpegEncodeOptions {
  inputPattern: string;
  outputPath: string;
  config: VideoConfig;
  audioPath?: string;
  onProgress?: (progress: RenderProgress) => void;
}

export class FFmpegEncoder {
  private async checkFFmpeg(): Promise<boolean> {
    try {
      await execa('ffmpeg', ['-version']);
      return true;
    } catch {
      return false;
    }
  }

  async encode(options: FFmpegEncodeOptions): Promise<string> {
    const { inputPattern, outputPath, config, audioPath, onProgress } = options;

    const ffmpegAvailable = await this.checkFFmpeg();
    if (!ffmpegAvailable) {
      throw new Error('FFmpeg not found. Please install FFmpeg on your system.');
    }

    const outputDir = dirname(outputPath);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const inputDir = dirname(inputPattern);
    const concatenatedFile = join(inputDir, 'all_frames.raw');
    await this.concatenateRawFrames(inputDir, concatenatedFile);

    const args = this.buildFFmpegArgs(concatenatedFile, outputPath, config, audioPath);

    logger.info({ args }, 'Starting FFmpeg encoding');

    try {
      const ffmpegProcess = execa('ffmpeg', args);

      if (onProgress && ffmpegProcess.stdout) {
        ffmpegProcess.stdout.on('data', (data: Buffer) => {
          const output = data.toString();
          const frameMatch = output.match(/frame=\s*(\d+)/);
          if (frameMatch) {
            const currentFrame = parseInt(frameMatch[1], 10);
            const totalFrames = Math.floor((config.duration / 1000) * config.fps);
            onProgress({
              frame: currentFrame,
              totalFrames,
              percentage: (currentFrame / totalFrames) * 100,
            });
          }
        });
      }

      await ffmpegProcess;

      logger.info({ outputPath }, 'FFmpeg encoding completed');
      return outputPath;
    } catch (error: any) {
      logger.error({ error: error.message }, 'FFmpeg encoding failed');
      throw new Error(`FFmpeg encoding failed: ${error.message}`);
    }
  }

  private async concatenateRawFrames(inputDir: string, outputFile: string): Promise<void> {
    const files = readdirSync(inputDir)
      .filter(f => f.endsWith('.raw') && f.startsWith('frame_'))
      .sort();
    
    if (existsSync(outputFile)) {
      unlinkSync(outputFile);
    }
    
    for (const file of files) {
      const data = readFileSync(join(inputDir, file));
      appendFileSync(outputFile, data);
    }
    
    logger.debug({ fileCount: files.length, outputFile }, 'Concatenated raw frames');
  }

  private buildFFmpegArgs(
    concatenatedFile: string,
    outputPath: string,
    config: VideoConfig,
    audioPath?: string
  ): string[] {
    const args: string[] = [
      '-y',
      '-f',
      'rawvideo',
      '-pixel_format',
      'rgb24',
      '-video_size',
      `${config.width}x${config.height}`,
      '-framerate',
      config.fps.toString(),
      '-i',
      concatenatedFile,
    ];

    if (audioPath) {
      args.push('-i', audioPath);
    }

    args.push(
      '-c:v',
      this.getVideoCodec(config.outputFormat),
      '-pix_fmt',
      'yuv420p'
    );

    if (config.quality) {
      const crf = this.qualityToCRF(config.quality);
      args.push('-crf', crf.toString());
    }

    if (config.outputFormat === 'mp4') {
      args.push('-preset', 'medium', '-movflags', '+faststart');
    } else if (config.outputFormat === 'webm') {
      args.push('-b:v', '1M');
    }

    if (audioPath) {
      args.push('-c:a', 'aac', '-b:a', '192k', '-shortest');
    }

    args.push(outputPath);

    return args;
  }

  private getVideoCodec(format: string): string {
    switch (format) {
      case 'mp4':
        return 'libx264';
      case 'webm':
        return 'libvpx-vp9';
      case 'gif':
        return 'gif';
      default:
        return 'libx264';
    }
  }

  private qualityToCRF(quality: string): number {
    switch (quality) {
      case 'low':
        return 28;
      case 'medium':
        return 23;
      case 'high':
        return 18;
      case 'ultra':
        return 15;
      default:
        return 23;
    }
  }

  async generateGif(
    inputPattern: string,
    outputPath: string,
    config: VideoConfig,
    scale: number = 480
  ): Promise<string> {
    const paletteArgs = [
      '-i',
      inputPattern,
      '-vf',
      `fps=${config.fps},scale=${scale}:-1:flags=lanczos,palettegen`,
      '-y',
      '/tmp/palette.png',
    ];

    await execa('ffmpeg', paletteArgs);

    const gifArgs = [
      '-i',
      inputPattern,
      '-i',
      '/tmp/palette.png',
      '-filter_complex',
      `fps=${config.fps},scale=${scale}:-1:flags=lanczos[x];[x][1:v]paletteuse`,
      '-y',
      outputPath,
    ];

    await execa('ffmpeg', gifArgs);

    logger.info({ outputPath }, 'GIF generation completed');
    return outputPath;
  }
}
