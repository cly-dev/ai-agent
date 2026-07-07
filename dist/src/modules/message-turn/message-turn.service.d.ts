import { type PaginatedResult } from '../../common/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryMessageTurnDto } from './dto/query-message-turn.dto';
import { type MessageTurnResponse } from './message-turn.types';
export declare class MessageTurnService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findPage(query: QueryMessageTurnDto): Promise<PaginatedResult<MessageTurnResponse>>;
    findPageBySessionId(sessionId: string, query: QueryMessageTurnDto): Promise<PaginatedResult<MessageTurnResponse>>;
    findOne(id: number): Promise<MessageTurnResponse>;
    private buildWhere;
    private buildOrderBy;
}
