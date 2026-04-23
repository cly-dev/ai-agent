import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

function resolveEnvName(nodeEnv: string | undefined): string | null {
  if (!nodeEnv) {
    return null;
  }

  const normalized = nodeEnv.trim().toLowerCase();
  if (normalized === 'test') {
    return '.env.test';
  }
  if (normalized === 'prod' || normalized === 'production') {
    return '.env.prod';
  }
  return null;
}

export function loadEnv(): void {
  const rootDir = process.cwd();
  const envFile = resolveEnvName(process.env.NODE_ENV);
  const envPaths = [
    envFile ? path.resolve(rootDir, envFile) : null,
    path.resolve(rootDir, '.env'),
  ].filter((item): item is string => Boolean(item));

  for (const envPath of envPaths) {
    if (!fs.existsSync(envPath)) {
      continue;
    }
    dotenv.config({ path: envPath });
  }
}

loadEnv();
