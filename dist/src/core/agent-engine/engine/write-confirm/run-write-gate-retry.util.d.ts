import type { AgentRunResult } from '../main/types/agent-engine.types';
import type { RunWriteConfirmResumeInput, WriteConfirmResumeDeps } from './write-confirm-resume.types';
import type { DraftReviewDecision } from '../../../draft-review';
export type RunWriteGateRetryInput = {
    resumeInput: RunWriteConfirmResumeInput['resumeInput'];
    prepared: RunWriteConfirmResumeInput['prepared'];
    scope: RunWriteConfirmResumeInput['scope'];
    deps: WriteConfirmResumeDeps;
    decision: DraftReviewDecision;
};
export declare function runWriteGateRetry(input: RunWriteGateRetryInput): Promise<AgentRunResult | null>;
