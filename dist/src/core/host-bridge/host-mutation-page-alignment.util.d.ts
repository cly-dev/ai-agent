import type { HostMutationRunStep, HostMutationScopedTool } from './host-mutation-step.types';
import type { AgentChatPageContext } from './page-context.types';
export declare function collectSuccessfulMutationIdentifierValues(input: {
    steps: HostMutationRunStep[];
    scopedTools: HostMutationScopedTool[];
}): Set<string>;
export declare function isPageContextAlignedWithSuccessfulMutations(input: {
    pageContext: AgentChatPageContext;
    steps: HostMutationRunStep[];
    scopedTools: HostMutationScopedTool[];
}): boolean;
