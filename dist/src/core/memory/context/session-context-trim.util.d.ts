import type { SessionContextTurn } from './session-context.types';
export declare function trimTurnsByCompressedWatermark(turns: SessionContextTurn[], compressedUpToMessageId: number | undefined): SessionContextTurn[];
