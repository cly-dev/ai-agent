/**
 * 从运营填写的「状态名称」生成 Intent state.key。
 * 前端连线面板应调用；服务端也可用于迁移/归一。
 */
export function slugWorkflowIntentStateKey(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) {
    return 'state';
  }
  const ascii = trimmed
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
  if (ascii.length > 0) {
    return ascii;
  }
  // 纯中文等：用稳定短 hash，避免空 key
  let hash = 0;
  for (let i = 0; i < trimmed.length; i += 1) {
    hash = (hash * 31 + trimmed.charCodeAt(i)) | 0;
  }
  return `s_${(hash >>> 0).toString(36)}`;
}

/**
 * 批量生成不重复的 state.key（同画布多条状态边）。
 */
export function allocateWorkflowIntentStateKeys(
  labels: readonly string[],
): string[] {
  const used = new Set<string>();
  return labels.map((label) => {
    const base = slugWorkflowIntentStateKey(label);
    let key = base;
    let n = 2;
    while (used.has(key)) {
      key = `${base}_${n}`;
      n += 1;
    }
    used.add(key);
    return key;
  });
}
