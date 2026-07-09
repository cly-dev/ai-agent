import type { RelationRef } from '../shared/relation-ref';
export declare class UserAppEntity {
    id?: number;
    userId: number;
    appId: number;
    roleId: number;
    createdAt?: Date;
    user: RelationRef;
    appClient: RelationRef;
    role: RelationRef;
}
