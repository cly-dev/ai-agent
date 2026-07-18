import { getWorkflowActionRegistryEntry } from '../workflow-action-registry';
import { legacyActionForDirectIrType } from '../map-ir-type-to-legacy-action.util';
import type { WorkflowIrNodeType } from '../workflow-ir.types';
import type { WorkflowActionKind } from '../workflow.types';
import { detectCluesExecutor } from '../detect-clues';
import { fetchDataExecutor, generateAndPushExecutor } from './delegate-react.executor';
import { summarizeImagesExecutor } from './summarize-images.executor';
import {
  awaitUserConfirmExecutor,
  composeMutationExecutor,
  writeDataExecutor,
} from './mutation-delegate.executor';
import { pageAwaitUserConfirmExecutor } from './page/page-await-user-confirm.executor';
import {
  pageComposeMutationExecutor,
  pageWriteDataExecutor,
} from './page/page-mutation-delegate.executor';
import { pageFetchDataExecutor } from './page/page-fetch-data.executor';
import { pageGenerateAndPushExecutor } from './page/page-generate-and-push.executor';
import { pagePresentMutationExecutor } from './page/page-present-mutation.executor';
import { pageSummarizeExecutor } from './page/page-summarize.executor';
import { presentMutationExecutor } from './present-mutation.executor';
import { summarizeActionExecutor } from './summarize-action.executor';
import type { WorkflowExecutor } from './workflow-executor.types';

const CHAT_EXECUTORS: WorkflowExecutor[] = [
  detectCluesExecutor,
  fetchDataExecutor,
  summarizeImagesExecutor,
  generateAndPushExecutor,
  summarizeActionExecutor,
  composeMutationExecutor,
  presentMutationExecutor,
  writeDataExecutor,
  awaitUserConfirmExecutor,
];

const PAGE_EXECUTORS: WorkflowExecutor[] = [
  detectCluesExecutor,
  pageFetchDataExecutor,
  summarizeImagesExecutor,
  pageGenerateAndPushExecutor,
  pageSummarizeExecutor,
  pagePresentMutationExecutor,
  pageComposeMutationExecutor,
  pageWriteDataExecutor,
  pageAwaitUserConfirmExecutor,
];

const CHAT_EXECUTOR_BY_ACTION = new Map<WorkflowActionKind, WorkflowExecutor>(
  CHAT_EXECUTORS.map((executor) => [executor.action, executor]),
);

const PAGE_EXECUTOR_BY_ACTION = new Map<WorkflowActionKind, WorkflowExecutor>(
  PAGE_EXECUTORS.map((executor) => [executor.action, executor]),
);

export function getWorkflowExecutor(
  action: WorkflowActionKind,
  profile: 'chat' | 'page' = 'chat',
): WorkflowExecutor | null {
  const entry = getWorkflowActionRegistryEntry(action);
  if (!entry?.implemented) {
    return null;
  }
  const registry =
    profile === 'page' ? PAGE_EXECUTOR_BY_ACTION : CHAT_EXECUTOR_BY_ACTION;
  return registry.get(action) ?? null;
}

/** §4.1d：按 IR type 解析 executor（direct 1:1；expand 经 ir_expand_adapter）。 */
export function getWorkflowExecutorByIrType(
  type: WorkflowIrNodeType,
  profile: 'chat' | 'page' = 'chat',
): WorkflowExecutor | null {
  const action = legacyActionForDirectIrType(type);
  if (!action) {
    return null;
  }
  return getWorkflowExecutor(action, profile);
}

export function listWorkflowExecutors(
  profile: 'chat' | 'page' = 'chat',
): WorkflowExecutor[] {
  return profile === 'page' ? [...PAGE_EXECUTORS] : [...CHAT_EXECUTORS];
}
