"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("../../../generated/prisma/client");
const pagination_1 = require("../../common/pagination");
const load_workflow_definition_util_1 = require("../../core/workflow/load-workflow-definition.util");
const workflow_edge_util_1 = require("../../core/workflow/graph/workflow-edge.util");
const derive_workflow_bindings_from_nodes_util_1 = require("../../core/workflow/derive-workflow-bindings-from-nodes.util");
const validate_workflow_util_1 = require("../../core/workflow/validate-workflow.util");
const workflow_preset_util_1 = require("../../core/workflow/workflow-preset.util");
const prisma_service_1 = require("../../prisma/prisma.service");
const workflow_mapper_1 = require("./workflow.mapper");
const workflow_types_1 = require("./workflow.types");
let WorkflowService = class WorkflowService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        var _a, _b, _c;
        await this.assertAppClientExists(dto.appClientId);
        const workflowKey = dto.workflowKey.trim();
        const graph = this.normalizePersistedGraph(this.resolveWorkflowGraph({
            profile: dto.profile,
            preset: dto.preset,
            presetConfig: dto.presetConfig,
            nodes: dto.nodes,
            requireExplicitEdges: dto.preset == null,
        }));
        const nodes = graph.nodes;
        const bindingResolution = (0, derive_workflow_bindings_from_nodes_util_1.resolveWorkflowBindingsForSave)({
            nodes,
            explicitTools: dto.tools,
            explicitHostTools: dto.hostTools,
        });
        if (bindingResolution.issues.length > 0) {
            throw new common_1.BadRequestException({
                code: 'WORKFLOW_BINDING_RESOLUTION_FAILED',
                message: 'Workflow tool bindings must be declared on node input.toolIds/toolId / input.hostToolIds/hostToolId; tools[] and hostTools[] may only set isRequired for those ids',
                issues: bindingResolution.issues,
            });
        }
        const tools = bindingResolution.tools;
        const hostTools = bindingResolution.hostTools;
        this.assertWorkflowValid({
            workflowKey,
            name: dto.name.trim(),
            profile: dto.profile,
            goal: (_a = dto.goal) !== null && _a !== void 0 ? _a : null,
            constraints: (_b = dto.constraints) !== null && _b !== void 0 ? _b : [],
            nodes,
            edges: graph.edges,
            entryNodeId: (_c = graph.entryNodeId) !== null && _c !== void 0 ? _c : undefined,
            bindings: this.toBindingRefs(tools, hostTools),
        });
        await this.assertBindingsExist(dto.appClientId, tools, hostTools);
        const nodesJson = (0, load_workflow_definition_util_1.serializeWorkflowGraphJson)(graph);
        try {
            const row = await this.prisma.$transaction(async (tx) => {
                var _a, _b, _c, _d, _e, _f, _g;
                const created = await tx.workflow.create({
                    data: {
                        appClientId: dto.appClientId,
                        workflowKey,
                        name: dto.name.trim(),
                        description: ((_a = dto.description) === null || _a === void 0 ? void 0 : _a.trim()) || null,
                        goal: ((_b = dto.goal) === null || _b === void 0 ? void 0 : _b.trim()) || null,
                        profile: dto.profile,
                        deliverable: (_c = dto.deliverable) !== null && _c !== void 0 ? _c : client_1.WorkflowDeliverable.answer,
                        nodes: nodesJson,
                        version: 1,
                        constraints: ((_d = dto.constraints) !== null && _d !== void 0 ? _d : []),
                        isActive: (_e = dto.isActive) !== null && _e !== void 0 ? _e : true,
                        sortOrder: (_f = dto.sortOrder) !== null && _f !== void 0 ? _f : 0,
                        workflowTools: tools.length
                            ? {
                                create: tools.map((item) => {
                                    var _a;
                                    return ({
                                        toolId: item.toolId,
                                        isRequired: (_a = item.isRequired) !== null && _a !== void 0 ? _a : false,
                                    });
                                }),
                            }
                            : undefined,
                        workflowHostTools: hostTools.length
                            ? {
                                create: hostTools.map((item) => {
                                    var _a;
                                    return ({
                                        hostToolId: item.hostToolId,
                                        isRequired: (_a = item.isRequired) !== null && _a !== void 0 ? _a : false,
                                    });
                                }),
                            }
                            : undefined,
                    },
                });
                await tx.workflowRevision.create({
                    data: {
                        workflowId: created.id,
                        version: 1,
                        nodes: created.nodes,
                        deliverable: created.deliverable,
                        constraints: created.constraints,
                        changeNote: ((_g = dto.changeNote) === null || _g === void 0 ? void 0 : _g.trim()) || 'initial version',
                    },
                });
                return tx.workflow.findUniqueOrThrow({
                    where: { id: created.id },
                    include: workflow_types_1.WORKFLOW_DETAIL_INCLUDE,
                });
            });
            return (0, workflow_mapper_1.toWorkflowResponse)(row);
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                throw new common_1.ConflictException(`Workflow workflowKey "${workflowKey}" already exists for this AppClient`);
            }
            throw error;
        }
    }
    async update(id, dto) {
        var _a, _b, _c, _d, _e, _f;
        const existing = await this.findEntityOrThrow(id);
        if (dto.preset != null && this.isNodesPayloadProvided(dto.nodes)) {
            throw new common_1.BadRequestException({
                code: 'WORKFLOW_PRESET_NODES_CONFLICT',
                message: 'Provide either preset + presetConfig or nodes, not both',
            });
        }
        const expandedFromPreset = dto.preset != null
            ? this.normalizePersistedGraph(this.resolveWorkflowGraph({
                profile: existing.profile,
                preset: dto.preset,
                presetConfig: dto.presetConfig,
                requireExplicitEdges: false,
            }))
            : null;
        if (dto.nodes != null && dto.preset == null) {
            this.assertBEndNodesIncludeEdges(dto.nodes);
        }
        const graphFromDto = expandedFromPreset != null
            ? expandedFromPreset
            : dto.nodes != null
                ? this.normalizePersistedGraph((0, load_workflow_definition_util_1.parseWorkflowGraphJson)(dto.nodes))
                : null;
        const nodes = graphFromDto === null || graphFromDto === void 0 ? void 0 : graphFromDto.nodes;
        const tools = dto.tools != null ? this.normalizeToolBindings(dto.tools) : undefined;
        const hostTools = dto.hostTools != null
            ? this.normalizeHostToolBindings(dto.hostTools)
            : undefined;
        if (dto.isActive === false) {
            await this.assertCanDeactivate(id);
        }
        const existingGraph = this.normalizePersistedGraph((0, load_workflow_definition_util_1.parseWorkflowGraphJson)(existing.nodes));
        const nextGraph = graphFromDto !== null && graphFromDto !== void 0 ? graphFromDto : existingGraph;
        const nextNodes = nextGraph.nodes;
        const shouldResolveBindings = nodes != null || tools != null || hostTools != null;
        const bindingResolution = shouldResolveBindings
            ? (0, derive_workflow_bindings_from_nodes_util_1.resolveWorkflowBindingsForSave)({
                nodes: nextNodes,
                explicitTools: tools,
                explicitHostTools: hostTools,
            })
            : null;
        if (bindingResolution === null || bindingResolution === void 0 ? void 0 : bindingResolution.issues.length) {
            throw new common_1.BadRequestException({
                code: 'WORKFLOW_BINDING_RESOLUTION_FAILED',
                message: 'Workflow tool bindings must be declared on node input.toolIds/toolId / input.hostToolIds/hostToolId; tools[] and hostTools[] may only set isRequired for those ids',
                issues: bindingResolution.issues,
            });
        }
        const resolvedTools = (_a = bindingResolution === null || bindingResolution === void 0 ? void 0 : bindingResolution.tools) !== null && _a !== void 0 ? _a : existing.workflowTools.map((row) => ({
            toolId: row.toolId,
            isRequired: row.isRequired,
        }));
        const resolvedHostTools = (_b = bindingResolution === null || bindingResolution === void 0 ? void 0 : bindingResolution.hostTools) !== null && _b !== void 0 ? _b : existing.workflowHostTools.map((row) => ({
            hostToolId: row.hostToolId,
            isRequired: row.isRequired,
        }));
        const nextBindings = shouldResolveBindings
            ? this.toBindingRefs(resolvedTools, resolvedHostTools)
            : {
                toolIds: existing.workflowTools.map((row) => row.toolId),
                hostToolIds: existing.workflowHostTools.map((row) => row.hostToolId),
            };
        const nodesChanged = dto.preset != null ||
            dto.nodes != null ||
            dto.deliverable != null ||
            dto.constraints != null;
        this.assertWorkflowValid({
            workflowKey: existing.workflowKey,
            name: (_d = (_c = dto.name) === null || _c === void 0 ? void 0 : _c.trim()) !== null && _d !== void 0 ? _d : existing.name,
            profile: existing.profile,
            goal: dto.goal !== undefined ? dto.goal : existing.goal,
            constraints: (_e = dto.constraints) !== null && _e !== void 0 ? _e : (Array.isArray(existing.constraints)
                ? existing.constraints
                : []),
            nodes: nextNodes,
            edges: nextGraph.edges,
            entryNodeId: (_f = nextGraph.entryNodeId) !== null && _f !== void 0 ? _f : undefined,
            bindings: nextBindings,
        });
        if (shouldResolveBindings) {
            await this.assertBindingsExist(existing.appClientId, resolvedTools, resolvedHostTools);
        }
        const nodesJson = graphFromDto != null
            ? (0, load_workflow_definition_util_1.serializeWorkflowGraphJson)(graphFromDto)
            : undefined;
        const row = await this.prisma.$transaction(async (tx) => {
            var _a, _b, _c;
            if (shouldResolveBindings) {
                await tx.workflowTool.deleteMany({ where: { workflowId: id } });
                if (resolvedTools.length > 0) {
                    await tx.workflowTool.createMany({
                        data: resolvedTools.map((item) => {
                            var _a;
                            return ({
                                workflowId: id,
                                toolId: item.toolId,
                                isRequired: (_a = item.isRequired) !== null && _a !== void 0 ? _a : false,
                            });
                        }),
                    });
                }
                await tx.workflowHostTool.deleteMany({ where: { workflowId: id } });
                if (resolvedHostTools.length > 0) {
                    await tx.workflowHostTool.createMany({
                        data: resolvedHostTools.map((item) => {
                            var _a;
                            return ({
                                workflowId: id,
                                hostToolId: item.hostToolId,
                                isRequired: (_a = item.isRequired) !== null && _a !== void 0 ? _a : false,
                            });
                        }),
                    });
                }
            }
            const nextVersion = nodesChanged ? existing.version + 1 : existing.version;
            const updated = await tx.workflow.update({
                where: { id },
                data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (dto.name != null ? { name: dto.name.trim() } : {})), (dto.description !== undefined
                    ? { description: ((_a = dto.description) === null || _a === void 0 ? void 0 : _a.trim()) || null }
                    : {})), (dto.goal !== undefined ? { goal: ((_b = dto.goal) === null || _b === void 0 ? void 0 : _b.trim()) || null } : {})), (dto.deliverable != null ? { deliverable: dto.deliverable } : {})), (nodesJson != null ? { nodes: nodesJson } : {})), (dto.constraints != null
                    ? { constraints: dto.constraints }
                    : {})), (dto.isActive != null ? { isActive: dto.isActive } : {})), (dto.sortOrder != null ? { sortOrder: dto.sortOrder } : {})), (nodesChanged ? { version: nextVersion } : {})),
                include: workflow_types_1.WORKFLOW_DETAIL_INCLUDE,
            });
            if (nodesChanged) {
                await tx.workflowRevision.create({
                    data: {
                        workflowId: id,
                        version: nextVersion,
                        nodes: updated.nodes,
                        deliverable: updated.deliverable,
                        constraints: updated.constraints,
                        changeNote: ((_c = dto.changeNote) === null || _c === void 0 ? void 0 : _c.trim()) || null,
                    },
                });
            }
            return updated;
        });
        if (nodesChanged || shouldResolveBindings) {
            await this.assertReferencingSkillsStillCompatible(id);
            await this.assertReferencingPageActionsStillCompatible(id);
        }
        return (0, workflow_mapper_1.toWorkflowResponse)(row);
    }
    async listPresets(profile) {
        return (0, workflow_preset_util_1.listWorkflowPresetCatalog)(profile);
    }
    async findOne(id) {
        const row = await this.findEntityOrThrow(id);
        return (0, workflow_mapper_1.toWorkflowResponse)(row);
    }
    async remove(id) {
        await this.findEntityOrThrow(id);
        await this.prisma.workflow.delete({ where: { id } });
        return { ok: true, id };
    }
    async findPage(query) {
        var _a;
        const { page, pageSize, skip, take } = (0, pagination_1.resolvePagination)(query.page, query.pageSize);
        const where = Object.assign(Object.assign(Object.assign(Object.assign({}, (query.appClientId != null ? { appClientId: query.appClientId } : {})), (query.profile != null ? { profile: query.profile } : {})), (query.isActive != null ? { isActive: query.isActive } : {})), (((_a = query.keyword) === null || _a === void 0 ? void 0 : _a.trim())
            ? {
                OR: [
                    { workflowKey: { contains: query.keyword.trim() } },
                    { name: { contains: query.keyword.trim() } },
                ],
            }
            : {}));
        const [rows, total] = await this.prisma.$transaction([
            this.prisma.workflow.findMany({
                where,
                skip,
                take,
                orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
                include: workflow_types_1.WORKFLOW_LIST_INCLUDE,
            }),
            this.prisma.workflow.count({ where }),
        ]);
        return (0, pagination_1.toPaginatedResult)(rows.map(workflow_mapper_1.toWorkflowListItem), total, page, pageSize);
    }
    async listRevisions(workflowId, query = {}) {
        var _a;
        const workflow = await this.findEntityOrThrow(workflowId);
        const limit = Math.min(Math.max((_a = query.limit) !== null && _a !== void 0 ? _a : 20, 1), 100);
        if (query.summary) {
            const rows = await this.prisma.workflowRevision.findMany({
                where: { workflowId },
                orderBy: { version: 'desc' },
                take: limit,
                select: {
                    id: true,
                    workflowId: true,
                    version: true,
                    deliverable: true,
                    changeNote: true,
                    createdAt: true,
                },
            });
            return rows.map((row) => (0, workflow_mapper_1.toWorkflowRevisionSummaryResponse)(row, workflow.version));
        }
        const rows = await this.prisma.workflowRevision.findMany({
            where: { workflowId },
            orderBy: { version: 'desc' },
            take: limit,
        });
        return rows.map((row) => (0, workflow_mapper_1.toWorkflowRevisionResponse)(row, workflow.version));
    }
    async findRevision(workflowId, version) {
        const workflow = await this.findEntityOrThrow(workflowId);
        const row = await this.prisma.workflowRevision.findUnique({
            where: {
                workflowId_version: {
                    workflowId,
                    version,
                },
            },
        });
        if (!row) {
            throw new common_1.NotFoundException({
                code: 'WORKFLOW_REVISION_NOT_FOUND',
                message: `Workflow ${workflowId} revision version=${version} not found`,
            });
        }
        return (0, workflow_mapper_1.toWorkflowRevisionResponse)(row, workflow.version);
    }
    async assertWorkflowReferenceCompatible(input) {
        const workflow = await this.prisma.workflow.findFirst({
            where: {
                id: input.workflowId,
                appClientId: input.appClientId,
                isActive: true,
            },
        });
        if (!workflow) {
            throw new common_1.BadRequestException(`Workflow ${input.workflowId} is not found or inactive for this AppClient`);
        }
    }
    async assertSkillWorkflowBindingsCompatible(input) {
        var _a;
        const workflow = await this.prisma.workflow.findFirst({
            where: {
                id: input.workflowId,
                appClientId: input.appClientId,
                isActive: true,
            },
            select: { id: true, version: true },
        });
        if (!workflow) {
            throw new common_1.BadRequestException(`Workflow ${input.workflowId} is not found or inactive for this AppClient`);
        }
        const pinVersion = (_a = input.workflowVersion) !== null && _a !== void 0 ? _a : null;
        if (pinVersion != null && pinVersion !== workflow.version) {
            const revision = await this.prisma.workflowRevision.findUnique({
                where: {
                    workflowId_version: {
                        workflowId: workflow.id,
                        version: pinVersion,
                    },
                },
            });
            if (!revision) {
                throw new common_1.BadRequestException(`Workflow ${input.workflowId} revision version=${pinVersion} not found`);
            }
        }
    }
    async assertPageActionWorkflowBindingsCompatible(input) {
        var _a;
        await this.assertWorkflowReferenceCompatible({
            workflowId: input.workflowId,
            appClientId: input.appClientId,
            entry: 'page_action',
        });
        const pinVersion = (_a = input.workflowVersion) !== null && _a !== void 0 ? _a : null;
        if (pinVersion == null) {
            return;
        }
        const workflow = await this.prisma.workflow.findFirst({
            where: {
                id: input.workflowId,
                appClientId: input.appClientId,
                isActive: true,
            },
            select: { id: true, version: true },
        });
        if (!workflow || pinVersion === workflow.version) {
            return;
        }
        const revision = await this.prisma.workflowRevision.findUnique({
            where: {
                workflowId_version: {
                    workflowId: workflow.id,
                    version: pinVersion,
                },
            },
        });
        if (!revision) {
            throw new common_1.BadRequestException(`Workflow ${input.workflowId} revision version=${pinVersion} not found`);
        }
    }
    async assertReferencingSkillsStillCompatible(_workflowId) {
    }
    async assertReferencingPageActionsStillCompatible(_workflowId) {
    }
    isNodesPayloadProvided(nodes) {
        var _a, _b;
        if (nodes == null) {
            return false;
        }
        if (Array.isArray(nodes)) {
            return nodes.length > 0;
        }
        if (typeof nodes === 'object' &&
            Array.isArray(nodes.nodes)) {
            return ((_b = (_a = nodes.nodes) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) > 0;
        }
        return true;
    }
    assertBEndNodesIncludeEdges(nodes) {
        if (Array.isArray(nodes)) {
            throw new common_1.BadRequestException({
                code: 'WORKFLOW_EDGES_REQUIRED',
                message: 'B 端须传 { nodes, edges, entryNodeId? }；线性流程也须声明 always 边，禁止仅传 nodes[]',
            });
        }
        if (nodes == null ||
            typeof nodes !== 'object' ||
            !Array.isArray(nodes.nodes) ||
            !Array.isArray(nodes.edges)) {
            throw new common_1.BadRequestException({
                code: 'WORKFLOW_EDGES_REQUIRED',
                message: 'B 端须传 { nodes, edges, entryNodeId? }，且 edges 必须为数组',
            });
        }
        const nodeList = nodes.nodes;
        const edgeList = nodes.edges;
        if (nodeList.length > 1 && edgeList.length === 0) {
            throw new common_1.BadRequestException({
                code: 'WORKFLOW_EDGES_REQUIRED',
                message: 'nodes 长度大于 1 时 edges 不能为空；请按节点顺序配置 always 边（或 clue/default 分支图）',
            });
        }
    }
    assertGraphEdgesWellFormed(graph) {
        if (!graph.edgesDeclared) {
            return;
        }
        if (graph.edgeParseIssues.length > 0) {
            throw new common_1.BadRequestException({
                code: 'WORKFLOW_EDGES_INVALID',
                message: 'edges 存在无法解析的项；请修正后重试（不会静默丢弃并改走线性）',
                issues: graph.edgeParseIssues,
            });
        }
    }
    normalizePersistedGraph(graph) {
        var _a, _b, _c, _d, _e, _f;
        this.assertGraphEdgesWellFormed(graph);
        if (graph.edgesDeclared) {
            return Object.assign(Object.assign({}, graph), { entryNodeId: (_c = (_a = graph.entryNodeId) !== null && _a !== void 0 ? _a : (_b = graph.nodes[0]) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : null });
        }
        const edges = graph.edges.length > 0
            ? graph.edges
            : (0, workflow_edge_util_1.synthesizeLinearWorkflowEdges)(graph.nodes);
        return {
            nodes: graph.nodes,
            edges,
            entryNodeId: (_f = (_d = graph.entryNodeId) !== null && _d !== void 0 ? _d : (_e = graph.nodes[0]) === null || _e === void 0 ? void 0 : _e.id) !== null && _f !== void 0 ? _f : null,
            edgesDeclared: false,
            edgeParseIssues: [],
        };
    }
    resolveWorkflowGraph(input) {
        if (input.preset != null && this.isNodesPayloadProvided(input.nodes)) {
            throw new common_1.BadRequestException({
                code: 'WORKFLOW_PRESET_NODES_CONFLICT',
                message: 'Provide either preset + presetConfig or nodes, not both',
            });
        }
        if (input.preset != null) {
            const config = (0, workflow_preset_util_1.parseWorkflowPresetConfig)(input.presetConfig);
            const issues = (0, workflow_preset_util_1.validateWorkflowPresetInput)({
                preset: input.preset,
                profile: input.profile,
                config,
            });
            if (issues.length > 0) {
                throw new common_1.BadRequestException({
                    code: 'WORKFLOW_PRESET_INVALID',
                    message: 'Workflow preset validation failed',
                    issues,
                });
            }
            const expandedNodes = (0, workflow_preset_util_1.expandWorkflowPreset)({
                preset: input.preset,
                profile: input.profile,
                config,
            });
            return (0, load_workflow_definition_util_1.parseWorkflowGraphJson)(expandedNodes);
        }
        if (!this.isNodesPayloadProvided(input.nodes)) {
            throw new common_1.BadRequestException({
                code: 'WORKFLOW_NODES_REQUIRED',
                message: 'Either preset or nodes must be provided',
            });
        }
        if (input.requireExplicitEdges !== false) {
            this.assertBEndNodesIncludeEdges(input.nodes);
        }
        const graph = (0, load_workflow_definition_util_1.parseWorkflowGraphJson)(input.nodes);
        if (graph.nodes.length === 0) {
            throw new common_1.BadRequestException({
                code: 'WORKFLOW_NODES_REQUIRED',
                message: 'Either preset or nodes must be provided',
            });
        }
        return graph;
    }
    resolveWorkflowNodes(input) {
        return this.resolveWorkflowGraph(input).nodes;
    }
    async findEntityOrThrow(id) {
        const row = await this.prisma.workflow.findUnique({
            where: { id },
            include: workflow_types_1.WORKFLOW_DETAIL_INCLUDE,
        });
        if (!row) {
            throw new common_1.NotFoundException(`Workflow ${id} not found`);
        }
        return row;
    }
    async assertAppClientExists(appClientId) {
        const row = await this.prisma.appClient.findUnique({
            where: { id: appClientId },
            select: { id: true },
        });
        if (!row) {
            throw new common_1.NotFoundException(`AppClient ${appClientId} not found`);
        }
    }
    assertWorkflowValid(input) {
        const issues = (0, validate_workflow_util_1.validateWorkflowDefinition)({
            definition: Object.assign({ workflowKey: input.workflowKey, name: input.name, profile: input.profile, goal: input.goal, constraints: input.constraints, nodes: input.nodes }, (input.edges != null
                ? { edges: input.edges, entryNodeId: input.entryNodeId }
                : {})),
            bindings: input.bindings,
        });
        if (issues.length > 0) {
            throw new common_1.BadRequestException({
                code: 'WORKFLOW_VALIDATION_FAILED',
                message: 'Workflow validation failed',
                issues,
            });
        }
    }
    normalizeToolBindings(tools) {
        if (!(tools === null || tools === void 0 ? void 0 : tools.length)) {
            return [];
        }
        const seen = new Set();
        return tools.filter((item) => {
            if (seen.has(item.toolId)) {
                return false;
            }
            seen.add(item.toolId);
            return true;
        });
    }
    normalizeHostToolBindings(hostTools) {
        if (!(hostTools === null || hostTools === void 0 ? void 0 : hostTools.length)) {
            return [];
        }
        const seen = new Set();
        return hostTools.filter((item) => {
            if (seen.has(item.hostToolId)) {
                return false;
            }
            seen.add(item.hostToolId);
            return true;
        });
    }
    toBindingRefs(tools, hostTools) {
        return {
            toolIds: tools.map((row) => row.toolId),
            hostToolIds: hostTools.map((row) => row.hostToolId),
        };
    }
    async assertBindingsExist(appClientId, tools, hostTools) {
        if (tools.length > 0) {
            const count = await this.prisma.tool.count({
                where: {
                    appClientId,
                    id: { in: tools.map((row) => row.toolId) },
                },
            });
            if (count !== tools.length) {
                throw new common_1.BadRequestException('One or more WorkflowTool bindings reference tools outside this AppClient');
            }
        }
        if (hostTools.length > 0) {
            const count = await this.prisma.hostTool.count({
                where: {
                    appClientId,
                    id: { in: hostTools.map((row) => row.hostToolId) },
                },
            });
            if (count !== hostTools.length) {
                throw new common_1.BadRequestException('One or more WorkflowHostTool bindings reference host tools outside this AppClient');
            }
        }
    }
    async assertCanDeactivate(workflowId) {
        const [skillCount, pageActionCount] = await this.prisma.$transaction([
            this.prisma.skill.count({
                where: { workflowId, isActive: true },
            }),
            this.prisma.pageAction.count({
                where: { workflowId, isActive: true },
            }),
        ]);
        if (skillCount > 0 || pageActionCount > 0) {
            throw new common_1.ConflictException({
                code: 'WORKFLOW_HAS_ACTIVE_REFERENCES',
                message: 'Cannot deactivate Workflow while active Skill or PageAction references exist',
                skillCount,
                pageActionCount,
            });
        }
    }
};
WorkflowService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WorkflowService);
exports.WorkflowService = WorkflowService;
//# sourceMappingURL=workflow.service.js.map