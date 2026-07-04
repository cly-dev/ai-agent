import type { LlmService } from '../../../../llm/llm.service';
import type { PromptRegistryService } from '../../../../prompt/prompt-registry.service';
import type { TurnExecutionContract } from '../../turn/turn-execution-contract.types';
import type { AutoOuterPlanSkillSelection } from './outer-plan-skill-resolve.util';
import { resolveOuterPlan, resolveRequestedSkillOuterPlan } from './task-plan-llm.util';
import type {
  ResolveOuterPlanInput,
  ResolveTaskPlanResult,
} from './task-plan.types';
import {
  buildChitchatPlanResult,
  buildHostToolWritePlanResult,
  buildPageContextEntityReadPlanResult,
  buildPageContextInlinePlanResult,
  buildRequestedSkillOuterPlanResult,
} from './task-plan.util';

/**
 * Plan 唯一入口：只读 TurnExecutionContract，不再分散 gate。
 */
export async function resolvePlanFromContract(input: {
  contract: TurnExecutionContract;
  autoSkillCandidate: AutoOuterPlanSkillSelection | null;
  llmService: LlmService;
  promptRegistry: PromptRegistryService;
  scope: { appClientId: number; agentId: number };
  planInput: ResolveOuterPlanInput;
}): Promise<ResolveTaskPlanResult> {
  const { contract, planInput } = input;
  if (!contract.plan.enabled) {
    throw new Error('resolvePlanFromContract called while contract.plan.enabled is false');
  }

  if (contract.routing.route === 'direct_answer') {
    return buildChitchatPlanResult({ userMessage: planInput.userMessage });
  }

  if (contract.routing.llmWriteChannel === 'none') {
    if (contract.plan.pageContextPlan === 'inline_answer') {
      return buildPageContextInlinePlanResult({
        userMessage: planInput.userMessage,
        pageContextUsage: contract.plan.pageContextUsage,
      });
    }
    if (contract.plan.pageContextPlan === 'entity_read_detail') {
      return buildPageContextEntityReadPlanResult({
        userMessage: planInput.userMessage,
        scopedToolSummaries: planInput.scopedToolSummaries,
        pageContextUsage: contract.plan.pageContextUsage,
      });
    }
  }

  switch (contract.plan.skillSelect) {
    case 'explicit': {
      const skillId = contract.plan.explicitSkillId ?? planInput.requestedSkillId;
      if (skillId == null) {
        throw new Error('turn contract skillSelect=explicit but explicitSkillId is null');
      }
      return resolveRequestedSkillOuterPlan({
        ...planInput,
        requestedSkillId: skillId,
      });
    }
    case 'page_host': {
      const skill =
        input.autoSkillCandidate?.skill ??
        planInput.availableSkills.find(
          (row) => row.id === contract.plan.pageHostSkillId,
        );
      if (!skill) {
        throw new Error('turn contract skillSelect=page_host but page host skill is missing');
      }
      return buildRequestedSkillOuterPlanResult({
        userMessage: planInput.userMessage,
        skill: {
          id: skill.id,
          name: skill.name,
          description: skill.description,
          riskLevel: skill.riskLevel,
          config: 'config' in skill ? skill.config : undefined,
          skillToolIds: 'skillToolIds' in skill ? skill.skillToolIds : undefined,
          hostToolIds: skill.hostToolIds,
        },
        scopedToolSummaries: planInput.scopedToolSummaries,
        pageHostPrimary: true,
        outerSkillSelectMethod: 'page_host_unique',
      });
    }
    case 'llm':
    default:
      if (
        contract.routing.llmWriteChannel === 'host' &&
        contract.plan.allowHostToolSteps &&
        (planInput.availableHostTools?.length ?? 0) > 0
      ) {
        const suggestedSkill =
          contract.routing.suggestedSkillId != null
            ? planInput.availableSkills.find(
                (skill) => skill.id === contract.routing.suggestedSkillId,
              )
            : null;
        const suggestedHostToolIds = new Set(suggestedSkill?.hostToolIds ?? []);
        const suggestedHostTools =
          suggestedHostToolIds.size > 0
            ? (planInput.availableHostTools ?? []).filter(
                (tool) =>
                  tool.id != null && suggestedHostToolIds.has(tool.id),
              )
            : [];
        return buildHostToolWritePlanResult({
          userMessage: planInput.userMessage,
          availableHostTools:
            suggestedHostTools.length > 0
              ? suggestedHostTools
              : (planInput.availableHostTools ?? []),
        });
      }
      return resolveOuterPlan({
        llmService: input.llmService,
        promptRegistry: input.promptRegistry,
        scope: input.scope,
        planInput: {
          ...planInput,
          requestedSkillId: undefined,
          requestedSkillDetail: undefined,
        },
      });
  }
}
