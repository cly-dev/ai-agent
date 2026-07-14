import type { PageContextPlanKind } from '../../../host-bridge/page-context-usage.types';
import type { TurnExecutionRoute } from '../../../host-bridge/page-context-execution-policy.util';
export type HostToolTurnPolicy = {
    allowHostToolSteps: boolean;
    allowHostToolAutoDispatch: boolean;
    allowHostToolLlmDispatch: boolean;
};
export declare function resolveHostToolTurnPolicy(input: {
    route: TurnExecutionRoute;
    pageContextPlan: PageContextPlanKind;
    writeChannel: 'none' | 'http' | 'host';
}): HostToolTurnPolicy;
