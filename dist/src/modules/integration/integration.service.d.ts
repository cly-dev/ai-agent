import { RuntimeCacheInvalidator } from '../../core/runtime-cache/runtime-cache-invalidator.service';
import { type PaginatedResult } from '../../common/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateIntegrationDto } from './dto/create-integration.dto';
import { QueryIntegrationDto } from './dto/query-integration.dto';
import { UpdateIntegrationDto } from './dto/update-integration.dto';
import { type IntegrationConnectionTestResult, type IntegrationResponse } from './integration.types';
import type { TestIntegrationConnectionDto } from './dto/test-integration-connection.dto';
export declare class IntegrationService {
    private readonly prisma;
    private readonly runtimeCacheInvalidator;
    constructor(prisma: PrismaService, runtimeCacheInvalidator: RuntimeCacheInvalidator);
    create(dto: CreateIntegrationDto): Promise<IntegrationResponse>;
    findPageByAppClientId(appClientId: number, query: QueryIntegrationDto): Promise<PaginatedResult<IntegrationResponse>>;
    findPage(query: QueryIntegrationDto): Promise<PaginatedResult<IntegrationResponse>>;
    findOne(id: number): Promise<IntegrationResponse>;
    update(id: number, dto: UpdateIntegrationDto): Promise<IntegrationResponse>;
    testConnection(options: {
        id?: number;
    } & TestIntegrationConnectionDto): Promise<IntegrationConnectionTestResult>;
    remove(id: number): Promise<IntegrationResponse>;
    private buildWhere;
    private buildOrderBy;
    private assertAppClientExists;
    private normalizeOptionalSecret;
    private normalizeOptionalText;
    private probeBaseUrl;
    private fetchProbe;
    private formatFetchError;
}
