import { SessionService } from './session.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { QuerySessionDto } from './dto/query-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
export declare class SessionController {
    private readonly service;
    constructor(service: SessionService);
    create(appClientId: number, body: CreateSessionDto): Promise<{
        appClient: {
            id: number;
            isActive: boolean;
            name: string;
        };
        _count: {
            messageTurns: number;
            agentRuns: number;
            messages: number;
        };
        user: {
            id: number;
            username: string;
        };
    } & {
        id: string;
        appClientId: number;
        agentId: number;
        title: string;
        createdAt: Date;
        userId: number;
    }>;
    findPage(appClientId: number, query: QuerySessionDto): Promise<import("../../common/pagination").PaginatedResult<{
        appClient: {
            id: number;
            isActive: boolean;
            name: string;
        };
        _count: {
            messageTurns: number;
            agentRuns: number;
            messages: number;
        };
        user: {
            id: number;
            username: string;
        };
    } & {
        id: string;
        appClientId: number;
        agentId: number;
        title: string;
        createdAt: Date;
        userId: number;
    }>>;
    update(appClientId: number, id: string, body: UpdateSessionDto): Promise<{
        appClient: {
            id: number;
            isActive: boolean;
            name: string;
        };
        _count: {
            messageTurns: number;
            agentRuns: number;
            messages: number;
        };
        user: {
            id: number;
            username: string;
        };
    } & {
        id: string;
        appClientId: number;
        agentId: number;
        title: string;
        createdAt: Date;
        userId: number;
    }>;
    remove(appClientId: number, id: string): Promise<{
        appClient: {
            id: number;
            isActive: boolean;
            name: string;
        };
        _count: {
            messageTurns: number;
            agentRuns: number;
            messages: number;
        };
        user: {
            id: number;
            username: string;
        };
    } & {
        id: string;
        appClientId: number;
        agentId: number;
        title: string;
        createdAt: Date;
        userId: number;
    }>;
    findOne(id: string): Promise<{
        appClient: {
            id: number;
            isActive: boolean;
            name: string;
        };
        _count: {
            messageTurns: number;
            agentRuns: number;
            messages: number;
        };
        user: {
            id: number;
            username: string;
        };
    } & {
        id: string;
        appClientId: number;
        agentId: number;
        title: string;
        createdAt: Date;
        userId: number;
    }>;
}
