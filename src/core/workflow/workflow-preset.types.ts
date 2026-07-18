import type { WorkflowProfile } from './workflow.types';

/** B 端场景 Preset：保存时展开为 WorkflowIntent，再策略编译为 IR。 */
export type WorkflowPresetKind =
  | 'page_auto_fill'
  | 'fetch_and_answer'
  | 'mutation_submit';

/**
 * 产品面 Preset 只收 Tool id。
 * 写入策略由绑定入口派生（Skill/Chat = mutate 必确认；PageAction = 不配 mutate），
 * 不在 Preset 上暴露 explainBeforeConfirm / summarizeAfter / skipConfirm。
 */
export type WorkflowPresetConfig = {
  readToolId?: number;
  writeToolId?: number;
  hostToolId?: number;
};

export type WorkflowPresetCatalogEntry = {
  kind: WorkflowPresetKind;
  label: string;
  description: string;
  profiles: WorkflowProfile[];
  requiredConfig: Array<keyof WorkflowPresetConfig>;
  optionalConfig: Array<keyof WorkflowPresetConfig>;
  expandedOperations: string[];
};

export type WorkflowPresetValidationIssue = {
  path: string;
  code: string;
  message: string;
};
