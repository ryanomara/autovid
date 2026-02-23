import { spawn } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import { unlink } from 'fs/promises';
import type { PixelBuffer } from '../engine/canvas.js';
import { createBuffer } from '../engine/canvas.js';
import { loadImageToBuffer } from '../engine/image-loader.js';

export interface VideoFrameRequest {
  src: string;
  time: number;
  width: number;
  height: number;
}

export const extractVideoFrame = async (request: VideoFrameRequest): Promise<PixelBuffer> => {
  const outputPath = join(
    tmpdir(),
    `autovid-frame-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`
  );

  const runExtraction = (timeMs: number): Promise<void> =>
    new Promise<void>((resolve, reject) => {
      const args = [
        '-ss',
        `${Math.max(0, timeMs) / 1000}`,
        '-i',
        request.src,
        '-frames:v',
        '1',
        '-vf',
        `scale=${request.width}:${request.height}`,
        '-update',
        '1',
        '-y',
        outputPath,
      ];
      const ffmpeg = spawn('ffmpeg', args);
      ffmpeg.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg exited with code ${code}`));
      });
      ffmpeg.on('error', reject);
    });

  try {
    try {
      await runExtraction(request.time);
    } catch {
      await runExtraction(0);
    }

    const buffer = await loadImageToBuffer(outputPath);
    return buffer ?? createBuffer(request.width, request.height);
  } finally {
    await unlink(outputPath).catch(() => undefined);
  }
};
