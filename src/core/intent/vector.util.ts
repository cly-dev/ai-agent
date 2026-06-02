/**
 * 意图召回向量工具：余弦相似度、embedding 文本拼装、关键词降级打分。
 * 不依赖外部向量库，在进程内对 dense vector 做点积计算。
 */

/** 等长 dense 向量的余弦相似度，范围约 [0, 1]（负值按 0 处理）。 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) {
    return 0;
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    normA += a[index] * a[index];
    normB += b[index] * b[index];
  }
  if (normA <= 0 || normB <= 0) {
    return 0;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/** 工具分类写入 embedding 的文本：`label` + 可选 `description`。 */
export function buildCategoryEmbedText(row: {
  label: string;
  description: string | null;
}): string {
  const label = row.label.trim();
  const description = row.description?.trim() ?? '';
  if (description) {
    return `${label}\n${description}`;
  }
  return label;
}

/** 单个工具写入 embedding 的文本：`name` + 可选 `description`。 */
export function buildToolEmbedText(row: {
  name: string;
  description: string;
}): string {
  const name = row.name.trim();
  const description = row.description?.trim() ?? '';
  if (description) {
    return `${name}\n${description}`;
  }
  return name;
}

/**
 * 工具级关键词召回分数（embedding 不可用时的降级方案）。
 * 对用户 query 分词，统计在工具 name/description 中的命中率。
 */
export function keywordToolRecallScore(
  query: string,
  tool: { name: string; description: string },
): number {
  const hay = buildToolEmbedText(tool).toLowerCase();
  const tokens = tokenizeKeywordQuery(query);
  if (tokens.length === 0) {
    return 0;
  }
  let hits = 0;
  for (const token of tokens) {
    if (hay.includes(token)) {
      hits += 1;
    }
  }
  return hits / tokens.length;
}

/**
 * 类目级关键词召回分数（embedding 不可用时的降级方案）。
 * 对用户 query 分词，统计在类目 label/description 中的命中率。
 */
export function keywordRecallScore(
  query: string,
  category: { label: string; description: string | null },
): number {
  const hay = buildCategoryEmbedText(category).toLowerCase();
  const tokens = tokenizeKeywordQuery(query);
  if (tokens.length === 0) {
    return 0;
  }
  let hits = 0;
  for (const token of tokens) {
    if (hay.includes(token)) {
      hits += 1;
    }
  }
  return hits / tokens.length;
}

/**
 * 关键词召回分词：
 * - 英文/数字词按自然词切分；
 * - 中文补充双字词（如“商品详情”->“商品”“品详”“详情”），提升业务词命中概率。
 */
function tokenizeKeywordQuery(query: string): string[] {
  const normalized = query.toLowerCase();
  const baseTokens = normalized
    .split(/[\s,，。！？!?、；;:：()（）【】\[\]{}<>《》"'`~\-_/\\|]+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2);

  const extraCjkTokens: string[] = [];
  for (const token of baseTokens) {
    if (/[\u4e00-\u9fff]/.test(token) && token.length >= 3) {
      for (let i = 0; i < token.length - 1; i += 1) {
        const gram = token.slice(i, i + 2);
        if (/^[\u4e00-\u9fff]{2}$/.test(gram)) {
          extraCjkTokens.push(gram);
        }
      }
    }
  }

  return [...new Set([...baseTokens, ...extraCjkTokens])];
}
