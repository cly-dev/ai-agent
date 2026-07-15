import type { ToolObservation } from '../agent-engine/engine/main/types/agent-engine.types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * 将 workflowNodeOutputs 压成 summarize 可用的精简 payload。
 * summarize_images：只保留 cells 摘要，去掉 timing / 大字段，避免撑爆 prompt。
 */
export function compactWorkflowNodeOutputForSummarize(
  ref: string,
  value: unknown,
): unknown {
  if (!isRecord(value)) {
    return value;
  }
  if (ref.includes('summarize_images') || ref.includes(':summarize_images:')) {
    const cellsRaw = value.cells;
    const cells = Array.isArray(cellsRaw)
      ? cellsRaw.map((cell) => {
          if (!isRecord(cell)) {
            return cell;
          }
          return {
            index: cell.index,
            url: cell.url,
            status: cell.status,
            summary: cell.summary,
            legible: cell.legible,
            cached: cell.cached,
            error: cell.error,
          };
        })
      : [];
    return {
      panelVersion: value.panelVersion ?? 1,
      cells,
      omittedCount: value.omittedCount ?? 0,
      ...(typeof value.visionError === 'string'
        ? { visionError: value.visionError }
        : {}),
    };
  }
  try {
    const text = JSON.stringify(value);
    if (text.length <= 4_000) {
      return value;
    }
    return {
      _truncated: true,
      preview: `${text.slice(0, 4_000)}…`,
    };
  } catch {
    return String(value);
  }
}

/**
 * Chat summarize 此前只看 toolObservations，会漏掉 obs:summarize_images:*。
 * 将节点输出镜像为 current_run 观测，供 buildSummarizeObservationFromState 消费。
 */
export function workflowNodeOutputsToSummarizeObservations(
  nodeOutputs: Record<string, unknown> | undefined,
): ToolObservation[] {
  if (!nodeOutputs || Object.keys(nodeOutputs).length === 0) {
    return [];
  }
  const rows: ToolObservation[] = [];
  for (const [ref, value] of Object.entries(nodeOutputs)) {
    rows.push({
      name: ref,
      output: compactWorkflowNodeOutputForSummarize(ref, value),
      quality: 'high',
    });
  }
  return rows;
}

/**
 * detect_clues priorOutputs 预算：优先完整保留 summarize_images，再截其它节点。
 */
export function formatPriorOutputsForDetectClues(
  priorOutputs: Record<string, unknown>,
  maxLen = 6_000,
): string {
  const entries = Object.entries(priorOutputs);
  if (entries.length === 0) {
    return '{}';
  }
  const imageEntries = entries.filter(([ref]) =>
    ref.includes('summarize_images'),
  );
  const otherEntries = entries.filter(
    ([ref]) => !ref.includes('summarize_images'),
  );
  const ordered = [...imageEntries, ...otherEntries];

  const imageBudget = Math.min(2_500, Math.floor(maxLen * 0.45));
  const otherBudget = Math.max(800, maxLen - imageBudget);
  const parts: string[] = [];
  let used = 2; // `{}` 开销近似

  for (const [ref, value] of ordered) {
    const isImage = ref.includes('summarize_images');
    const budget = isImage ? imageBudget : otherBudget;
    const compact = isImage
      ? compactWorkflowNodeOutputForSummarize(ref, value)
      : value;
    let text: string;
    try {
      text = JSON.stringify(compact);
    } catch {
      text = String(compact);
    }
    if (text.length > budget) {
      text = `${text.slice(0, budget)}…`;
    }
    const piece = `${JSON.stringify(ref)}:${text}`;
    if (used + piece.length + 1 > maxLen) {
      if (isImage && parts.length === 0) {
        // 至少塞进识图截断版
        const room = Math.max(200, maxLen - used - 20);
        parts.push(
          `${JSON.stringify(ref)}:${text.slice(0, room)}…`,
        );
      }
      break;
    }
    parts.push(piece);
    used += piece.length + 1;
  }

  return `{${parts.join(',')}}`;
}
