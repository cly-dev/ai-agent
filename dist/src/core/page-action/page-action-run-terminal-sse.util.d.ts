import { PageActionRunStatus } from '../../../generated/prisma/client';
import type { PageActionRunCompletion } from './page-action-run-completion.util';
import type { PageActionRunStepRecorder } from './page-action-run-steps.util';
import type { PageActionSseSink } from './stream/page-action-sse-sink.types';
export type PageActionRunTerminalPhase = 'awaiting_approval' | 'completed' | 'failed';
export type PageActionRunTerminalOutcome = {
    phase: PageActionRunTerminalPhase;
    fillText: string | null;
    errorCode: string | null;
    errorMessage: string | null;
};
export declare function resolvePageActionRunTerminalOutcome(completion: PageActionRunCompletion): PageActionRunTerminalOutcome;
export declare function mapTerminalPhaseToRunStatus(phase: PageActionRunTerminalPhase): PageActionRunStatus;
export declare function emitPageActionRunTerminalSse(input: {
    sseSink: PageActionSseSink;
    recorder: PageActionRunStepRecorder;
    actionRunId: number;
    actionKey: string;
    generation: number;
    clientActionId: string | null;
    streamId: string | null;
    outcome: PageActionRunTerminalOutcome;
    dslOutcome?: string | null;
}): void;
