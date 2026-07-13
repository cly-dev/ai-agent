import { QueryMessageTurnDto } from './dto/query-message-turn.dto';
import { MessageTurnService } from './message-turn.service';
export declare class MessageTurnController {
    private readonly service;
    constructor(service: MessageTurnService);
    findPage(query: QueryMessageTurnDto): Promise<import("../../common/pagination").PaginatedResult<import("./message-turn.types").MessageTurnResponse>>;
    findPageBySessionId(sessionId: string, query: QueryMessageTurnDto): Promise<import("../../common/pagination").PaginatedResult<import("./message-turn.types").MessageTurnResponse>>;
    findOne(id: number): Promise<import("./message-turn.types").MessageTurnResponse>;
}
