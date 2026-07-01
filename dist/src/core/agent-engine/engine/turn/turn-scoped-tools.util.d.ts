import type { BuiltLangChainTools } from '../../../tool-engine/tool-engine.service';
import type { AgentEngineTool } from '../main/types/agent-engine.types';
import type { TurnExecutionContract } from './turn-execution-contract.types';
import type { RequestedSkillRunContext } from '../main/skill/requested-skill-run.service';
export type TurnScopedToolsBundle = {
    scopedTools: AgentEngineTool[];
    scopedLangChainTools: BuiltLangChainTools['tools'];
    scopedToolBundle: BuiltLangChainTools;
    scopedAllowedToolIds: number[];
};
export type TurnScopedToolsSource = 'intent' | 'explicit_skill';
export declare function bundleFromAllowedRunInput(input: {
    tools: AgentEngineTool[];
    langChainTools: BuiltLangChainTools;
    allowedToolIds: number[];
}): TurnScopedToolsBundle;
export declare function bundleFromRequestedSkillCtx(ctx: RequestedSkillRunContext): TurnScopedToolsBundle;
export declare function resolveScopedToolsSourceFromContract(contract: TurnExecutionContract): TurnScopedToolsSource;
export declare function shouldUseExplicitSkillScopedTools(contract: TurnExecutionContract): boolean;
export declare function applyTurnScopedToolsFromContract(input: {
    contract: TurnExecutionContract;
    intentScopedTools: TurnScopedToolsBundle;
    requestedSkillCtx: RequestedSkillRunContext | null;
}): TurnScopedToolsBundle;
export declare function spreadScopedToolsBundle(bundle: TurnScopedToolsBundle): Pick<TurnScopedToolsBundle, 'scopedTools' | 'scopedLangChainTools' | 'scopedToolBundle' | 'scopedAllowedToolIds'>;
