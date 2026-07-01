import type { MessageTurnDetailRow, MessageTurnResponse } from './message-turn.types';
export declare function toMessageTurnResponse(row: MessageTurnDetailRow): MessageTurnResponse;
export declare function toMessageTurnResponseList(rows: MessageTurnDetailRow[]): MessageTurnResponse[];
