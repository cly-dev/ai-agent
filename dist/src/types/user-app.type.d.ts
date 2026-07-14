import type { RelationRef } from '../shared/relation-ref';
export interface UserAppType {
    id?: number;
    userId: number;
    appId: number;
    roleId: number;
    createdAt?: Date;
    user: RelationRef;
    appClient: RelationRef;
    role: RelationRef;
}
