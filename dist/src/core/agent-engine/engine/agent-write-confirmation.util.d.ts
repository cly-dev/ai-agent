import type { PendingToolObservation } from '../../../modules/chat/pending-write-confirmation.types';
import type { ToolObservation } from './main/types/agent-engine.types';
export declare function serializeObservationsForPending(observations: ToolObservation[]): PendingToolObservation[];
export declare function deserializePendingObservations(rows: PendingToolObservation[]): ToolObservation[];
