import type { RelationRef } from '../shared/relation-ref';
export interface AdminUserType {
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
