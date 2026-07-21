import os from 'node:os';
import path from 'node:path';

const uploadRoot = process.env.VERCEL === '1' ? os.tmpdir() : process.cwd();

export const uploadBaseDir = path.join(uploadRoot, 'uploads');

export const getUploadDir = (...segments: string[]) =>
  path.join(uploadBaseDir, ...segments);
