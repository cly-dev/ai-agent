import type { WorkflowIrNodeType } from './workflow-ir.types';
import type { WorkflowActionKind } from './workflow.types';
import type {
  AwaitUserConfirmNodeInput,
  ComposeMutationNodeInput,
  DetectCluesNodeInput,
  FetchDataNodeInput,
  GenerateAndPushNodeInput,
  PresentMutationNodeInput,
  SummarizeImagesNodeInput,
  SummarizeNodeInput,
  WriteDataNodeInput,
} from './workflow-node-input.types';

/**
 * 从 IR node.config + 物化 action 推导 runtime input（§4.1e native）。
 * materialize 与 executor 共用，避免 config→input 双真源。
 * 无法识别的 (irType, action) 返回 null，调用方回退 legacy def.input。
 */
export function deriveWorkflowNodeInputFromIr(input: {
  irType: WorkflowIrNodeType;
  config: Record<string, unknown>;
  action: WorkflowActionKind;
}):
  | FetchDataNodeInput
  | GenerateAndPushNodeInput
  | SummarizeNodeInput
  | DetectCluesNodeInput
  | WriteDataNodeInput
  | SummarizeImagesNodeInput
  | ComposeMutationNodeInput
  | PresentMutationNodeInput
  | AwaitUserConfirmNodeInput
  | null {
  const cfg = input.config;

  switch (input.irType) {
    case 'data_query':
      if (input.action !== 'fetch_data') return null;
      return {
        toolIds: Array.isArray(cfg.toolIds)
          ? (cfg.toolIds as number[])
          : undefined,
        completeWhen: cfg.completeWhen as
          | 'first_success'
          | 'fetch_all_pages'
          | undefined,
      };
    case 'host_effect':
      if (input.action !== 'generate_and_push') return null;
      return {
        hostToolIds: Array.isArray(cfg.hostToolIds)
          ? (cfg.hostToolIds as number[])
          : undefined,
      };
    case 'message_send':
      if (input.action !== 'summarize') return null;
      return {
        mode:
          (cfg.mode as 'brief' | 'detailed' | 'draft' | 'final') ?? 'final',
        stream: cfg.stream as boolean | undefined,
      };
    case 'structured_output':
      if (input.action !== 'detect_clues') return null;
      return { hint: cfg.hint as string | undefined };
    case 'tool_call':
      if (input.action !== 'write_data') return null;
      return {
        toolId: cfg.toolId as number,
        useComposedArgs: cfg.useComposedArgs !== false,
      };
    case 'llm':
      if (input.action === 'summarize_images') {
        return {
          from: cfg.from as
            | 'upstream'
            | 'page_context'
            | 'all'
            | undefined,
          maxCells: cfg.maxCells as number | undefined,
          maxGroups: cfg.maxGroups as number | undefined,
          maxCellsPerGroup: cfg.maxCellsPerGroup as number | undefined,
          hint: cfg.hint as string | undefined,
          onFailure: cfg.onFailure as 'degrade' | 'fail' | undefined,
          cacheTtlSec: cfg.cacheTtlSec as number | undefined,
        };
      }
      if (input.action === 'summarize') {
        // 非 vision llm expand：固定 draft（与 materializeExpandIrNode 一致）
        return { mode: 'draft' as const, stream: false };
      }
      return null;
    case 'data_transform':
      if (
        input.action !== 'compose_mutation' ||
        cfg.purpose !== 'compose_mutation'
      ) {
        return null;
      }
      return { toolId: cfg.toolId as number };
    case 'human_task':
      if (input.action === 'present_mutation') {
        return {
          mode: (cfg.presentMode as 'brief' | 'detailed') ?? 'brief',
        };
      }
      if (input.action === 'await_user_confirm') {
        return {
          confirmKind: (cfg.kind as 'mutation' | 'generic') ?? 'mutation',
        };
      }
      return null;
    default:
      return null;
  }
}
