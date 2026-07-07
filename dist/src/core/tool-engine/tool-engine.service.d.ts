import { PrismaService } from '../../prisma/prisma.service';
import { OutboundHttpService } from '../outbound-http/outbound-http.service';
import type { BuiltLangChainTools, ToolBuildContext, ToolDebugOptions, ToolDebugResult, ToolExecutionDefinition, ToolExecutionResult } from './tool-engine.types';
export type { BuiltLangChainTools, ToolBuildContext, ToolDebugOptions, ToolDebugResult, ToolDefinitionInput, ToolExecutionDefinition, ToolExecutionResult, ToolIntegrationDefinition, } from './tool-engine.types';
export declare class ToolEngineService {
    private readonly prisma;
    private readonly outboundHttp;
    private readonly logger;
    private static readonly MAX_TIMEOUT_MS;
    constructor(prisma: PrismaService, outboundHttp: OutboundHttpService);
    buildLangChainTools(definitions: ToolExecutionDefinition[], ctx: ToolBuildContext): BuiltLangChainTools;
    invokeLangChainTool(bundle: BuiltLangChainTools, toolName: string, input: Record<string, unknown>): Promise<ToolExecutionResult>;
    debugExecute(toolId: number, options?: ToolDebugOptions): Promise<ToolDebugResult>;
    executeByName(toolName: string, input: Record<string, unknown>, allowedToolIds: number[], userId: number, options?: {
        integrationCredentialCache?: ReadonlyMap<string, string>;
        preloadedDefinition?: ToolExecutionDefinition;
    }): Promise<ToolExecutionResult>;
    private loadToolDefinitionByName;
    executeFromDefinition(def: ToolExecutionDefinition, input: Record<string, unknown>, userId: number, options?: Pick<ToolBuildContext, 'integrationCredentialCache'>): Promise<ToolExecutionResult>;
    private buildBaseHeaders;
    private resolveAuthCredential;
    private applyHeaderParameters;
    private loadOpenApiParameterSpecs;
    private applyPathPlaceholders;
    private reservedBodyKeys;
    private resolveUrl;
    private appendQueryParam;
    private buildJsonBody;
    private toHttpMethod;
    private safeJsonParse;
    private resolveTimeoutMs;
    private formatOutboundFetchError;
    private writeToolDebugSnapshot;
    private redactSecret;
    private redactHeaders;
}
