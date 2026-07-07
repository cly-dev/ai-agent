import { CreateIntegrationDto } from './dto/create-integration.dto';
import { QueryIntegrationDto } from './dto/query-integration.dto';
import { TestIntegrationConnectionByUrlDto, TestIntegrationConnectionDto } from './dto/test-integration-connection.dto';
import { UpdateIntegrationDto } from './dto/update-integration.dto';
import { IntegrationService } from './integration.service';
export declare class IntegrationController {
    private readonly service;
    constructor(service: IntegrationService);
    create(body: CreateIntegrationDto): Promise<import("./integration.types").IntegrationResponse>;
    findPage(query: QueryIntegrationDto): Promise<import("../../common/pagination").PaginatedResult<import("./integration.types").IntegrationResponse>>;
    findByAppClient(appClientId: number, query: QueryIntegrationDto): Promise<import("../../common/pagination").PaginatedResult<import("./integration.types").IntegrationResponse>>;
    testConnectionByUrl(body: TestIntegrationConnectionByUrlDto): Promise<import("./integration.types").IntegrationConnectionTestResult>;
    testConnectionById(id: number, body: TestIntegrationConnectionDto): Promise<import("./integration.types").IntegrationConnectionTestResult>;
    findOne(id: number): Promise<import("./integration.types").IntegrationResponse>;
    update(id: number, body: UpdateIntegrationDto): Promise<import("./integration.types").IntegrationResponse>;
    remove(id: number): Promise<import("./integration.types").IntegrationResponse>;
}
