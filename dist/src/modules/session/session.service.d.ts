import { type PaginatedResult } from '../../common/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { QuerySessionDto } from './dto/query-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { type SessionResponse } from './session.types';
export declare class SessionService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(appClientId: number, dto: CreateSessionDto): Promise<SessionResponse>;
    findPage(appClientId: number, query: QuerySessionDto): Promise<PaginatedResult<SessionResponse>>;
    findOneById(id: string): Promise<SessionResponse>;
    findOne(appClientId: number, id: string): Promise<SessionResponse>;
    update(appClientId: number, id: string, dto: UpdateSessionDto): Promise<SessionResponse>;
    remove(appClientId: number, id: string): Promise<SessionResponse>;
    private buildWhere;
    private buildOrderBy;
    private normalizeSessionId;
    private assertAppClientExists;
    private assertUserExists;
    private assertAgentBelongsToApp;
}
