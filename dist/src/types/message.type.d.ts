import type { RelationRef } from '../shared/relation-ref';
export interface MessageType {
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
