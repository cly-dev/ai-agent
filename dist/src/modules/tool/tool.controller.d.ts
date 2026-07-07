import { ToolService } from './tool.service';
import { BatchSetToolsActiveDto } from './dto/batch-set-tools-active.dto';
import { CreateToolDto } from './dto/create-tool.dto';
import { DebugToolDto } from './dto/debug-tool.dto';
import { InitToolSchemasFromDebugDto } from './dto/init-tool-schemas-from-debug.dto';
import { ImportToolsFromSwaggerDto } from './dto/import-tools-from-swagger.dto';
import { QueryToolDto } from './dto/query-tool.dto';
import { UpdateToolDto } from './dto/update-tool.dto';
export declare class ToolController {
    private readonly service;
    constructor(service: ToolService);
    create(body: CreateToolDto): Promise<import("./tool.types").ToolResponse>;
    findPage(query: QueryToolDto): Promise<import("../../common/pagination").PaginatedResult<import("./tool.types").ToolResponse>>;
    findByAppClient(appClientId: number, query: QueryToolDto): Promise<import("../../common/pagination").PaginatedResult<import("./tool.types").ToolResponse>>;
    initSchemasFromDebug(appClientId: number, id: number, body: InitToolSchemasFromDebugDto): Promise<import("./tool.types").InitToolSchemasFromDebugResult>;
    importFromSwagger(body: ImportToolsFromSwaggerDto): Promise<import("../../codegen/swagger-tool-import.core").SwaggerToolImportResult>;
    batchSetActive(body: BatchSetToolsActiveDto): Promise<{
        isActive: boolean;
        updatedCount: number;
        notFoundIds: number[];
        items: import("./tool.types").ToolResponse[];
    }>;
    debug(id: number, body: DebugToolDto): Promise<import("../../core/tool-engine").ToolDebugResult>;
    findOne(id: number): Promise<import("./tool.types").ToolResponse>;
    update(id: number, body: UpdateToolDto): Promise<import("./tool.types").ToolResponse>;
    remove(id: number): Promise<import("./tool.types").ToolResponse>;
}
