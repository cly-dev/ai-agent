import type { DraftReviewDecision } from '../../../draft-review';
import type { PendingWriteConfirmationSnapshot } from '../../../../modules/chat/pending-write-confirmation.types';
import type { AgentService } from '../../../../modules/agent/agent.service';
import type { ToolEngineService } from '../../../tool-engine/tool-engine.service';
export declare function validateWriteGateEditedToolCalls(input: {
    consumed: PendingWriteConfirmationSnapshot;
    decision: DraftReviewDecision;
    userId: number;
    agentService: AgentService;
    toolEngine: ToolEngineService;
}): Promise<void>;
