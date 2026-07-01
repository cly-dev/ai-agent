import type { BuiltLangChainTools } from '../../../tool-engine/tool-engine.service';
import type { AgentEngineTool } from '../main/types/agent-engine.types';
import type { TurnExecutionContract } from './turn-execution-contract.types';
import type { RequestedSkillRunContext } from '../main/skill/requested-skill-run.service';

/** 图内 HTTP scopedTools 四元组（intent 或 explicit skill 来源）。 */
export type TurnScopedToolsBundle = {
  scopedTools: AgentEngineTool[];
  scopedLangChainTools: BuiltLangChainTools['tools'];
  scopedToolBundle: BuiltLangChainTools;
  scopedAllowedToolIds: number[];
};

export type TurnScopedToolsSource = 'intent' | 'explicit_skill';

export function bundleFromAllowedRunInput(input: {
  tools: AgentEngineTool[];
  langChainTools: BuiltLangChainTools;
  allowedToolIds: number[];
}): TurnScopedToolsBundle {
  return {
    scopedTools: input.tools,
    scopedLangChainTools: input.langChainTools.tools,
    scopedToolBundle: input.langChainTools,
    scopedAllowedToolIds: input.allowedToolIds,
  };
}

export function emptyScopedToolsBundle(): TurnScopedToolsBundle {
  return {
    scopedTools: [],
    scopedLangChainTools: [],
    scopedToolBundle: { tools: [], byName: new Map() },
    scopedAllowedToolIds: [],
  };
}

export function bundleFromRequestedSkillCtx(
  ctx: RequestedSkillRunContext,
): TurnScopedToolsBundle {
  return {
    scopedTools: ctx.scoped.scopedTools,
    scopedLangChainTools: ctx.scoped.scopedLangChainTools,
    scopedToolBundle: ctx.scoped.scopedToolBundle,
    scopedAllowedToolIds: ctx.scoped.scopedAllowedToolIds,
  };
}

export function resolveScopedToolsSourceFromContract(
  contract: TurnExecutionContract,
): TurnScopedToolsSource {
  return contract.plan.scopedToolsSource;
}

export function shouldUseExplicitSkillScopedTools(
  contract: TurnExecutionContract,
): boolean {
  return resolveScopedToolsSourceFromContract(contract) === 'explicit_skill';
}

/**
 * 契约落地：本轮 ReAct / Plan 实际使用的 HTTP scopedTools。
 * - explicit_skill：预选 Skill 且与意图对齐
 * - intent：intent 节点收窄结果（或 defer 时的全量 allowed）
 */
export function applyTurnScopedToolsFromContract(input: {
  contract: TurnExecutionContract;
  intentScopedTools: TurnScopedToolsBundle;
  requestedSkillCtx: RequestedSkillRunContext | null;
}): TurnScopedToolsBundle {
  if (
    shouldUseExplicitSkillScopedTools(input.contract) &&
    input.requestedSkillCtx != null
  ) {
    return bundleFromRequestedSkillCtx(input.requestedSkillCtx);
  }
  return input.intentScopedTools;
}

export function spreadScopedToolsBundle(
  bundle: TurnScopedToolsBundle,
): Pick<
  TurnScopedToolsBundle,
  | 'scopedTools'
  | 'scopedLangChainTools'
  | 'scopedToolBundle'
  | 'scopedAllowedToolIds'
> {
  return {
    scopedTools: bundle.scopedTools,
    scopedLangChainTools: bundle.scopedLangChainTools,
    scopedToolBundle: bundle.scopedToolBundle,
    scopedAllowedToolIds: bundle.scopedAllowedToolIds,
  };
}
