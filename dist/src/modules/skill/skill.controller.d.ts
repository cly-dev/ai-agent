import { Request } from 'express';
import { SkillService } from './skill.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { QueryClientSkillByAgentDto } from './dto/query-client-skill-by-agent.dto';
import { QuerySkillDto } from './dto/query-skill.dto';
import { ReplaceSkillToolsDto } from './dto/skill-tool-binding.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
export declare class SkillController {
    private readonly service;
    constructor(service: SkillService);
    private appClientId;
    private userId;
    listForClientByAgent(req: Request & {
        user?: {
            userId?: number;
        };
    }, agentId: number, query: QueryClientSkillByAgentDto): Promise<import("./types/skill.types").SkillClientListItem[]>;
    createForAppClient(appClientId: number, body: CreateSkillDto): Promise<import("./types/skill.types").SkillResponse>;
    create(agentId: number, appClientId: number, body: CreateSkillDto): Promise<import("./types/skill.types").SkillResponse>;
    findByAgent(agentId: number, appClientId: number, query: QuerySkillDto): Promise<import("../../common/pagination").PaginatedResult<import("./types/skill.types").SkillResponse>>;
    findByAppClient(appClientId: number, query: QuerySkillDto): Promise<import("../../common/pagination").PaginatedResult<import("./types/skill.types").SkillResponse>>;
    findOne(skillId: number): Promise<import("./types/skill.types").SkillResponse>;
    update(skillId: number, body: UpdateSkillDto): Promise<import("./types/skill.types").SkillResponse>;
    replaceTools(skillId: number, body: ReplaceSkillToolsDto): Promise<import("./types/skill.types").SkillResponse>;
    remove(skillId: number): Promise<import("./types/skill.types").SkillResponse>;
}
