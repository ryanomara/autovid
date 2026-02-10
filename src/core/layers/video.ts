import { spawn } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import { readFile } from 'fs/promises';
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
  const outputPath = join(tmpdir(), `autovid-frame-${Date.now()}.png`);

  await new Promise<void>((resolve, reject) => {
    const args = [
      '-ss',
      `${request.time / 1000}`,
      '-i',
      request.src,
      '-frames:v',
      '1',
      '-vf',
      `scale=${request.width}:${request.height}`,
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

  const buffer = await loadImageToBuffer(outputPath);
  return buffer ?? createBuffer(request.width, request.height);
};
