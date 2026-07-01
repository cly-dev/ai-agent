import type { SessionGoaPayload } from '../goa/session-goa.types';
export declare function isSessionHistorySummaryAcceptable(summary: string): boolean;
export declare function formatSessionMemoryForCompression(goa: SessionGoaPayload): string | null;
