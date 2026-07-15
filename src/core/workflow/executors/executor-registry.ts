import { getWorkflowActionRegistryEntry } from '../workflow-action-registry';
import type { WorkflowActionKind } from '../workflow.types';
import { detectCluesExecutor } from '../detect-clues';
import { fetchDataExecutor, generateAndPushExecutor } from './delegate-react.executor';
import { loadPageContextExecutor } from './load-page-context.executor';
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
  loadPageContextExecutor,
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
  loadPageContextExecutor,
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

export function listWorkflowExecutors(
  profile: 'chat' | 'page' = 'chat',
): WorkflowExecutor[] {
  return profile === 'page' ? [...PAGE_EXECUTORS] : [...CHAT_EXECUTORS];
}
