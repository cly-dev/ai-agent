import type { SessionDetailRow, SessionResponse } from './session.types';
export declare function toSessionResponse(row: SessionDetailRow): SessionResponse;
export declare function toSessionResponseList(rows: SessionDetailRow[]): SessionResponse[];
