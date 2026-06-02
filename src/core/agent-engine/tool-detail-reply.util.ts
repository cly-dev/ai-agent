/**
 * 详情类问题：将投影后的工具结果格式化为 Markdown，可跳过二次 LLM summarize。
 */

const DEFAULT_MAX_CHARS = 12_000;
const MAX_DEPTH = 5;

export function renderStructuredToolDetailReply(
  output: unknown,
  options: {
    toolName: string;
    fieldLabels?: Record<string, string>;
    maxChars?: number;
  },
): string | null {
  const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS;
  const labels = options.fieldLabels ?? {};
  if (output == null) {
    return null;
  }

  const sections: string[] = [`## 查询结果（${options.toolName}）`];

  if (typeof output === 'string') {
    const body = output.trim();
    if (!body) {
      return null;
    }
    sections.push(body);
  } else if (Array.isArray(output)) {
    sections.push(renderArraySection('列表', output, labels, 0));
  } else if (typeof output === 'object') {
    sections.push(...renderObjectSections(output as Record<string, unknown>, labels));
  } else {
    sections.push(String(output));
  }

  const text = sections.filter(Boolean).join('\n\n').trim();
  if (!text || text.length > maxChars) {
    return null;
  }
  return text;
}

function renderObjectSections(
  row: Record<string, unknown>,
  labels: Record<string, string>,
): string[] {
  const priorityKeys = [
    'id',
    'title',
    'brand',
    'status',
    'shopId',
    'backCategory',
    'gmtCreate',
    'gmtModify',
  ];
  const sections: string[] = [];
  const baseLines: string[] = [];

  const used = new Set<string>();
  for (const key of priorityKeys) {
    if (key in row) {
      used.add(key);
      const line = formatScalarLine(key, row[key], labels);
      if (line) {
        baseLines.push(line);
      }
    }
  }
  for (const [key, value] of Object.entries(row)) {
    if (used.has(key) || value == null) {
      continue;
    }
    if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
      continue;
    }
    const line = formatScalarLine(key, value, labels);
    if (line) {
      baseLines.push(line);
    }
  }
  if (baseLines.length > 0) {
    sections.push(['## 基础信息', ...baseLines].join('\n'));
  }

  for (const [key, value] of Object.entries(row)) {
    if (value == null || !Array.isArray(value)) {
      continue;
    }
    if (value.length === 0) {
      continue;
    }
    const title = sectionTitleForArrayKey(key, labels);
    sections.push(`## ${title}\n${renderArraySection(key, value, labels, 0)}`);
  }

  return sections;
}

function sectionTitleForArrayKey(key: string, labels: Record<string, string>): string {
  const mapped = labels[key] ?? labels[`*.${key}`];
  if (mapped) {
    return mapped;
  }
  const lower = key.toLowerCase();
  if (lower.includes('sku')) {
    return 'SKU';
  }
  if (lower.includes('logistic')) {
    return '物流';
  }
  if (lower.includes('seo')) {
    return 'SEO';
  }
  if (lower.includes('media')) {
    return '媒体';
  }
  return key;
}

function renderArraySection(
  key: string,
  items: unknown[],
  labels: Record<string, string>,
  depth: number,
): string {
  if (depth >= MAX_DEPTH) {
    return '（层级过深，已省略）';
  }
  const lines: string[] = [];
  const limit = Math.min(items.length, 50);
  for (let i = 0; i < limit; i += 1) {
    const item = items[i];
    if (item == null) {
      continue;
    }
    if (typeof item === 'object' && !Array.isArray(item)) {
      const row = item as Record<string, unknown>;
      const parts = Object.entries(row)
        .map(([k, v]) => formatScalarLine(k, v, labels, '：'))
        .filter((p): p is string => Boolean(p));
      lines.push(parts.length > 0 ? `- ${parts.join('；')}` : `- （空对象）`);
    } else {
      lines.push(`- ${formatPrimitive(item)}`);
    }
  }
  if (items.length > limit) {
    lines.push(`- … 另有 ${items.length - limit} 条未展示`);
  }
  if (lines.length === 0) {
    return `（${key} 无内容）`;
  }
  return lines.join('\n');
}

function formatScalarLine(
  key: string,
  value: unknown,
  labels: Record<string, string>,
  sep = ': ',
): string | null {
  if (value == null) {
    return null;
  }
  const label = labels[key] ?? key;
  const text = formatPrimitive(value);
  if (!text) {
    return null;
  }
  return `- ${label}${sep}${text}`;
}

function formatPrimitive(value: unknown): string {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  try {
    const s = JSON.stringify(value);
    return s.length > 500 ? `${s.slice(0, 500)}…` : s;
  } catch {
    return String(value);
  }
}
