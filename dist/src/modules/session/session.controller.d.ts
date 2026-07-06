import { SessionService } from './session.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { QuerySessionDto } from './dto/query-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
export declare class SessionController {
    private readonly service;
    constructor(service: SessionService);
    create(appClientId: number, body: CreateSessionDto): Promise<{
        user: {
            id: number;
            username: string;
        };
        _count: {
            messageTurns: number;
            messages: number;
            agentRuns: number;
        };
        appClient: {
            name: string;
            id: number;
            isActive: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: number;
        appClientId: number;
        agentId: number;
        title: string;
    }>;
    findPage(appClientId: number, query: QuerySessionDto): Promise<import("../../common/pagination").PaginatedResult<{
        user: {
            id: number;
            username: string;
        };
        _count: {
            messageTurns: number;
            messages: number;
            agentRuns: number;
        };
        appClient: {
            name: string;
            id: number;
            isActive: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: number;
        appClientId: number;
        agentId: number;
        title: string;
    }>>;
    update(appClientId: number, id: string, body: UpdateSessionDto): Promise<{
        user: {
            id: number;
            username: string;
        };
        _count: {
            messageTurns: number;
            messages: number;
            agentRuns: number;
        };
        appClient: {
            name: string;
            id: number;
            isActive: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: number;
        appClientId: number;
        agentId: number;
        title: string;
    }>;
    remove(appClientId: number, id: string): Promise<{
        user: {
            id: number;
            username: string;
        };
        _count: {
            messageTurns: number;
            messages: number;
            agentRuns: number;
        };
        appClient: {
            name: string;
            id: number;
            isActive: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: number;
        appClientId: number;
        agentId: number;
        title: string;
    }>;
    findOne(id: string): Promise<{
        user: {
            id: number;
            username: string;
        };
        _count: {
            messageTurns: number;
            messages: number;
            agentRuns: number;
        };
        appClient: {
            name: string;
            id: number;
            isActive: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: number;
        appClientId: number;
        agentId: number;
        title: string;
    }>;
}
