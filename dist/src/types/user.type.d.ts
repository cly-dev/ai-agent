import type { RelationRef } from '../shared/relation-ref';
export interface UserType {
    id?: number;
    employeeId: string;
    email: string;
    password: string;
    username: string;
    mustChangePassword?: boolean;
    createdAt?: Date;
    sessions: RelationRef[];
    llmModelConfigs: RelationRef[];
    userApps: RelationRef[];
}
