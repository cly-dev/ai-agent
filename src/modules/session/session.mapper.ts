import type { SessionDetailRow, SessionResponse } from './session.types';

export function toSessionResponse(row: SessionDetailRow): SessionResponse {
  return row;
}

export function toSessionResponseList(rows: SessionDetailRow[]): SessionResponse[] {
  return rows.map((row) => toSessionResponse(row));
}
