import * as fs from 'fs';
import * as path from 'path';

const DEFAULT_TAGS = ['think', 'redacted_thinking', 'reasoning'];

let cachedTags: string[] | null = null;

export function loadLlmReasoningBlockTags(): string[] {
  if (cachedTags) {
    return cachedTags;
  }
  const file = path.join(
    process.cwd(),
    'src',
    'core',
    'llm',
    'llm-reasoning-block-tags.json',
  );
  try {
    const raw = fs.readFileSync(file, 'utf-8');
    const parsed = JSON.parse(raw) as { tags?: unknown };
    const tags = Array.isArray(parsed?.tags)
      ? parsed.tags
          .map((item) => (typeof item === 'string' ? item.trim() : ''))
          .filter((item) => item.length > 0)
      : [];
    cachedTags = tags.length > 0 ? tags : DEFAULT_TAGS;
    return cachedTags;
  } catch {
    cachedTags = DEFAULT_TAGS;
    return cachedTags;
  }
}
