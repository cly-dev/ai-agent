import type { RelationRef } from '../shared/relation-ref';
export declare class MessageEntity {
    id?: number;
    sessionId: string;
    role: string;
    content?: string | null;
    toolName?: string | null;
    toolInput?: unknown | null;
    toolOutput?: unknown | null;
    createdAt?: Date;
    session: RelationRef;
}
