import { PageActionRunStatus } from '../../../generated/prisma/client';
import type { PageActionRunStepRecorder } from './page-action-run-steps.util';
import type { PageActionSseSink } from './stream/page-action-sse-sink.types';
export type PageActionRunTerminalPhase = 'awaiting_approval' | 'completed' | 'failed';
export type PageActionRunTerminalOutcome = {
    phase: PageActionRunTerminalPhase;
    fillText: string | null;
    errorCode: string | null;
    errorMessage: string | null;
};
export declare function resolvePageActionRunTerminalOutcome(input: {
    suspended?: boolean;
    errorCode?: string | null;
    errorMessage?: string | null;
    fillText?: string | null;
}): PageActionRunTerminalOutcome;
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
