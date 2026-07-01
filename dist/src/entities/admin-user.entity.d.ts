import type { RelationRef } from '../shared/relation-ref';
export declare class AdminUserEntity {
    id?: number;
    email: string;
    password: string;
    username: string;
    role: RelationRef;
    isActive?: boolean;
    mustChangePassword?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
