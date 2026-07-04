import type { LlmService } from '../../../../llm/llm.service';
import type { PromptRegistryService } from '../../../../prompt/prompt-registry.service';
import type { SkillService } from '../../../../skill/skill.service';
import type { AvailableSkillRow } from '../../../../skill/skill.types';
import type { ToolBuildContext } from '../../../../tool-engine/tool-engine.service';
import type { AgentEngineTool } from '../types/agent-engine.types';
import type { TaskPlanSnapshot } from '../plan/task-plan.types';
import type { HostToolDecisionDefinition } from '../../../../host-bridge/host-tool-decision.types';
export type SkillFrameExpandResult = {
    plan: TaskPlanSnapshot;
    scopedTools: AgentEngineTool[];
    scopedAllowedToolIds: number[];
    scopedToolBundle: ReturnType<SkillService['bindSkillToScopedTools']>['scopedToolBundle'];
    skill: AvailableSkillRow | null;
};
export declare function filterDecisionHostToolsForSkill(hostTools: HostToolDecisionDefinition[], skill: AvailableSkillRow | null): HostToolDecisionDefinition[];
export declare function expandPendingSkillStepIfNeeded(input: {
    plan: TaskPlanSnapshot;
    scopedTools: AgentEngineTool[];
    toolBuildCtx: ToolBuildContext;
    skillService: SkillService;
    llmService: LlmService;
    promptRegistry: PromptRegistryService;
    scope: {
        appClientId: number;
        agentId: number;
    };
    agentId: number;
    userId: number;
    appClientId: number;
    enforceRequestedSkill?: boolean;
    availableHostTools?: Array<{
        id?: number;
        name: string;
        description: string;
    }>;
    scopedHostToolIds?: number[];
}): Promise<SkillFrameExpandResult>;
