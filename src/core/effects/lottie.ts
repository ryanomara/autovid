import { readFile } from 'fs/promises';

export interface LottieAsset {
  path: string;
  data: Record<string, any>;
}

export const loadLottie = async (path: string): Promise<LottieAsset> => {
  const raw = await readFile(path, 'utf-8');
  return { path, data: JSON.parse(raw) };
};
