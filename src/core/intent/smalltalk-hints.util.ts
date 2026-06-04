import * as fs from 'fs';
import * as path from 'path';

let cachedHints: string[] | null = null;

export function loadSmallTalkHints(): string[] {
  if (cachedHints) {
    return cachedHints;
  }
  const file = path.join(
    process.cwd(),
    'src',
    'core',
    'intent',
    'smalltalk-hints.json',
  );
  try {
    const raw = fs.readFileSync(file, 'utf-8');
    const parsed = JSON.parse(raw) as { hints?: unknown };
    cachedHints = Array.isArray(parsed?.hints)
      ? parsed.hints
          .map((item) =>
            typeof item === 'string' ? item.trim().toLowerCase() : '',
          )
          .filter((item) => item.length > 0)
      : [];
    return cachedHints;
  } catch {
    cachedHints = [];
    return cachedHints;
  }
}
