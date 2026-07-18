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
exports.FlowService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("../../../generated/prisma/client");
const pagination_1 = require("../../common/pagination");
const derive_workflow_bindings_from_nodes_util_1 = require("../../core/workflow/derive-workflow-bindings-from-nodes.util");
const validate_workflow_util_1 = require("../../core/workflow/validate-workflow.util");
const workflow_preset_util_1 = require("../../core/workflow/workflow-preset.util");
const workflow_intent_state_key_util_1 = require("../../core/workflow/workflow-intent-state-key.util");
const resolve_workflow_intent_persist_util_1 = require("../../core/workflow/resolve-workflow-intent-persist.util");
const prisma_service_1 = require("../../prisma/prisma.service");
const infer_intent_from_legacy_nodes_util_1 = require("../../core/workflow/infer-intent-from-legacy-nodes.util");
const materialize_workflow_graph_from_ir_util_1 = require("../../core/workflow/materialize-workflow-graph-from-ir.util");
const load_workflow_definition_util_1 = require("../../core/workflow/load-workflow-definition.util");
const parse_workflow_ir_util_1 = require("../../core/workflow/parse-workflow-ir.util");
const flow_mapper_1 = require("./flow.mapper");
const flow_types_1 = require("./flow.types");
function throwIntentPersistError(error) {
    var _a;
    if (error &&
        typeof error === 'object' &&
        'code' in error &&
        typeof error.code === 'string') {
        const err = error;
        throw new common_1.BadRequestException(Object.assign({ code: err.code, message: (_a = err.message) !== null && _a !== void 0 ? _a : err.code }, (err.issues != null ? { issues: err.issues } : {})));
    }
    throw error;
}
let FlowService = class FlowService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const prepared = await this.prepareFlowCreate(dto);
        try {
            const row = await this.prisma.$transaction(async (tx) => this.insertFlowRecord(tx, prepared));
            return (0, flow_mapper_1.toFlowResponse)(row);
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                throw new common_1.ConflictException(`Flow flowKey "${prepared.flowKey}" already exists for this AppClient`);
            }
            throw error;
        }
    }
    async prepareFlowCreate(dto) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        await this.assertAppClientExists(dto.appClientId);
        const flowKey = dto.flowKey.trim();
        let resolved;
        try {
            resolved = (0, resolve_workflow_intent_persist_util_1.resolveWorkflowIntentForPersist)({
                profile: dto.profile,
                preset: dto.preset,
                presetConfig: dto.presetConfig,
                intent: dto.intent,
            });
        }
        catch (error) {
            throwIntentPersistError(error);
        }
        const bindingResolution = (0, derive_workflow_bindings_from_nodes_util_1.resolveWorkflowBindingsForSave)({
            nodes: resolved.legacyGraph.nodes,
            explicitTools: dto.tools,
            explicitHostTools: dto.hostTools,
        });
        if (bindingResolution.issues.length > 0) {
            throw new common_1.BadRequestException({
                code: 'FLOW_BINDING_RESOLUTION_FAILED',
                message: 'Flow tool bindings must come from Intent slots / compiled IR; tools[] may only set isRequired',
                issues: bindingResolution.issues,
            });
        }
        const tools = bindingResolution.tools;
        const hostTools = bindingResolution.hostTools;
        this.assertFlowValid({
            flowKey,
            name: dto.name.trim(),
            profile: dto.profile,
            goal: (_a = dto.goal) !== null && _a !== void 0 ? _a : null,
            constraints: (_b = dto.constraints) !== null && _b !== void 0 ? _b : [],
            legacyNodes: resolved.legacyGraph.nodes,
            legacyEdges: resolved.legacyGraph.edges,
            entryNodeId: resolved.legacyGraph.entryNodeId,
            toolIds: tools.map((t) => t.toolId),
            hostToolIds: hostTools.map((h) => h.hostToolId),
        });
        await this.assertBindingsExist(dto.appClientId, tools, hostTools);
        return {
            appClientId: dto.appClientId,
            flowKey,
            name: dto.name.trim(),
            description: ((_c = dto.description) === null || _c === void 0 ? void 0 : _c.trim()) || null,
            goal: ((_d = dto.goal) === null || _d === void 0 ? void 0 : _d.trim()) || null,
            profile: dto.profile,
            deliverable: (_e = dto.deliverable) !== null && _e !== void 0 ? _e : client_1.WorkflowDeliverable.answer,
            intentJson: resolved.intent,
            irJson: resolved.ir,
            constraints: ((_f = dto.constraints) !== null && _f !== void 0 ? _f : []),
            isActive: (_g = dto.isActive) !== null && _g !== void 0 ? _g : true,
            sortOrder: (_h = dto.sortOrder) !== null && _h !== void 0 ? _h : 0,
            changeNote: ((_j = dto.changeNote) === null || _j === void 0 ? void 0 : _j.trim()) || 'initial version',
            tools,
            hostTools,
        };
    }
    async insertFlowRecord(tx, prepared) {
        const created = await tx.flow.create({
            data: {
                appClientId: prepared.appClientId,
                flowKey: prepared.flowKey,
                name: prepared.name,
                description: prepared.description,
                goal: prepared.goal,
                profile: prepared.profile,
                deliverable: prepared.deliverable,
                intent: prepared.intentJson,
                ir: prepared.irJson,
                version: 1,
                constraints: prepared.constraints,
                isActive: prepared.isActive,
                sortOrder: prepared.sortOrder,
                flowTools: prepared.tools.length
                    ? {
                        create: prepared.tools.map((item) => {
                            var _a;
                            return ({
                                toolId: item.toolId,
                                isRequired: (_a = item.isRequired) !== null && _a !== void 0 ? _a : false,
                            });
                        }),
                    }
                    : undefined,
                flowHostTools: prepared.hostTools.length
                    ? {
                        create: prepared.hostTools.map((item) => {
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
        await tx.flowRevision.create({
            data: {
                flowId: created.id,
                version: 1,
                intent: created.intent,
                ir: created.ir,
                deliverable: created.deliverable,
                constraints: created.constraints,
                changeNote: prepared.changeNote,
            },
        });
        return tx.flow.findUniqueOrThrow({
            where: { id: created.id },
            include: flow_types_1.FLOW_DETAIL_INCLUDE,
        });
    }
    async listMigrationCandidates(input) {
        await this.assertAppClientExists(input.appClientId);
        const rows = await this.prisma.workflow.findMany({
            where: {
                appClientId: input.appClientId,
                OR: [
                    { skills: { some: {} } },
                    { pageActions: { some: {} } },
                ],
            },
            select: {
                id: true,
                workflowKey: true,
                name: true,
                profile: true,
                isActive: true,
                _count: {
                    select: { skills: true, pageActions: true },
                },
            },
            orderBy: [{ isActive: 'desc' }, { id: 'asc' }],
        });
        return {
            items: rows.map((row) => ({
                workflowId: row.id,
                workflowKey: row.workflowKey,
                name: row.name,
                profile: row.profile,
                isActive: row.isActive,
                skillRefCount: row._count.skills,
                pageActionRefCount: row._count.pageActions,
                previewPath: `/admin/flow/migrate-from-workflow/${row.id}/preview`,
                migratePath: `/admin/flow/migrate-from-workflow/${row.id}`,
            })),
        };
    }
    async previewMigrateFromWorkflow(workflowId, flowKeyOverride) {
        const source = await this.prisma.workflow.findUnique({
            where: { id: workflowId },
            include: {
                _count: { select: { skills: true, pageActions: true } },
            },
        });
        if (!source) {
            throw new common_1.NotFoundException(`Workflow ${workflowId} not found`);
        }
        const suggestedFlowKey = ((flowKeyOverride === null || flowKeyOverride === void 0 ? void 0 : flowKeyOverride.trim()) || source.workflowKey).trim();
        const existingFlow = await this.prisma.flow.findFirst({
            where: {
                appClientId: source.appClientId,
                flowKey: suggestedFlowKey,
            },
            select: { id: true },
        });
        const flowKeyAvailable = existingFlow == null;
        const nodes = (0, load_workflow_definition_util_1.parseWorkflowNodesJson)(source.nodes);
        try {
            const inferred = (0, infer_intent_from_legacy_nodes_util_1.inferWorkflowIntentFromLegacyNodes)({
                profile: source.profile,
                nodes,
            });
            const warnings = [
                ...inferred.warnings,
                ...(flowKeyAvailable
                    ? []
                    : [
                        `flowKey "${suggestedFlowKey}" already exists; pass a different flowKey on migrate`,
                    ]),
            ];
            const lossy = inferred.matchedPattern === 'custom' ||
                inferred.warnings.some((w) => w.includes('branching') ||
                    w.includes('not preserved') ||
                    w.includes('collapsed'));
            return {
                sourceWorkflowId: source.id,
                suggestedFlowKey,
                profile: source.profile,
                canMigrate: flowKeyAvailable,
                lossy,
                matchedPattern: inferred.matchedPattern,
                warnings,
                intent: inferred.intent,
                error: null,
                flowKeyAvailable,
                rebind: {
                    skillCount: source._count.skills,
                    pageActionCount: source._count.pageActions,
                },
            };
        }
        catch (error) {
            const err = error && typeof error === 'object'
                ? error
                : {};
            return {
                sourceWorkflowId: source.id,
                suggestedFlowKey,
                profile: source.profile,
                canMigrate: false,
                lossy: false,
                matchedPattern: null,
                warnings: flowKeyAvailable
                    ? []
                    : [
                        `flowKey "${suggestedFlowKey}" already exists; pass a different flowKey on migrate`,
                    ],
                intent: null,
                error: {
                    code: typeof err.code === 'string' ? err.code : 'LEGACY_INTENT_INFER_FAILED',
                    message: typeof err.message === 'string'
                        ? err.message
                        : 'Failed to infer Intent from legacy nodes',
                },
                flowKeyAvailable,
                rebind: {
                    skillCount: source._count.skills,
                    pageActionCount: source._count.pageActions,
                },
            };
        }
    }
    async migrateFromWorkflow(workflowId, dto) {
        var _a, _b;
        const source = await this.prisma.workflow.findUnique({
            where: { id: workflowId },
        });
        if (!source) {
            throw new common_1.NotFoundException(`Workflow ${workflowId} not found`);
        }
        const nodes = (0, load_workflow_definition_util_1.parseWorkflowNodesJson)(source.nodes);
        let inferred;
        try {
            inferred = (0, infer_intent_from_legacy_nodes_util_1.inferWorkflowIntentFromLegacyNodes)({
                profile: source.profile,
                nodes,
            });
        }
        catch (error) {
            throwIntentPersistError(error);
        }
        const flowKey = (((_a = dto.flowKey) === null || _a === void 0 ? void 0 : _a.trim()) || source.workflowKey).trim();
        const createDto = {
            appClientId: source.appClientId,
            flowKey,
            name: source.name,
            description: source.description,
            goal: source.goal,
            profile: source.profile,
            deliverable: source.deliverable,
            intent: inferred.intent,
            constraints: Array.isArray(source.constraints)
                ? source.constraints
                : [],
            isActive: source.isActive,
            sortOrder: source.sortOrder,
            changeNote: ((_b = dto.changeNote) === null || _b === void 0 ? void 0 : _b.trim()) ||
                `migrated from workflowId=${workflowId} (${inferred.matchedPattern})`,
        };
        const prepared = await this.prepareFlowCreate(createDto);
        const rebindBindings = dto.rebindBindings !== false;
        const deactivateSource = dto.deactivateSource !== false;
        try {
            const result = await this.prisma.$transaction(async (tx) => {
                const row = await this.insertFlowRecord(tx, prepared);
                let skillsUpdated = 0;
                let pageActionsUpdated = 0;
                if (rebindBindings) {
                    const skillResult = await tx.skill.updateMany({
                        where: {
                            appClientId: source.appClientId,
                            workflowId: source.id,
                        },
                        data: {
                            flowId: row.id,
                            flowVersion: row.version,
                            workflowId: null,
                            workflowVersion: null,
                        },
                    });
                    const pageActionResult = await tx.pageAction.updateMany({
                        where: {
                            appClientId: source.appClientId,
                            workflowId: source.id,
                        },
                        data: {
                            flowId: row.id,
                            flowVersion: row.version,
                            workflowId: null,
                            workflowVersion: null,
                        },
                    });
                    skillsUpdated = skillResult.count;
                    pageActionsUpdated = pageActionResult.count;
                }
                if (deactivateSource) {
                    await tx.workflow.update({
                        where: { id: source.id },
                        data: { isActive: false },
                    });
                }
                return {
                    flow: (0, flow_mapper_1.toFlowResponse)(row),
                    skillsUpdated,
                    pageActionsUpdated,
                };
            });
            return {
                flow: result.flow,
                sourceWorkflowId: source.id,
                matchedPattern: inferred.matchedPattern,
                warnings: inferred.warnings,
                rebind: {
                    skillsUpdated: result.skillsUpdated,
                    pageActionsUpdated: result.pageActionsUpdated,
                },
                sourceDeactivated: deactivateSource,
            };
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                throw new common_1.ConflictException(`Flow flowKey "${flowKey}" already exists for this AppClient`);
            }
            throw error;
        }
    }
    async update(id, dto) {
        var _a, _b, _c;
        const existing = await this.findEntityOrThrow(id);
        if (dto.preset != null && dto.intent != null) {
            throw new common_1.BadRequestException({
                code: 'FLOW_PRESET_INTENT_CONFLICT',
                message: 'Provide either preset or intent, not both',
            });
        }
        const intentChanged = dto.preset != null || dto.intent != null;
        let resolved = null;
        if (intentChanged) {
            try {
                resolved = (0, resolve_workflow_intent_persist_util_1.resolveWorkflowIntentForPersist)({
                    profile: existing.profile,
                    preset: dto.preset,
                    presetConfig: dto.presetConfig,
                    intent: dto.intent,
                });
            }
            catch (error) {
                throwIntentPersistError(error);
            }
        }
        const tools = dto.tools != null ? this.normalizeToolBindings(dto.tools) : undefined;
        const hostTools = dto.hostTools != null
            ? this.normalizeHostToolBindings(dto.hostTools)
            : undefined;
        const nextLegacyNodes = (_a = resolved === null || resolved === void 0 ? void 0 : resolved.legacyGraph.nodes) !== null && _a !== void 0 ? _a : this.legacyNodesFromIr(existing.ir);
        const shouldResolveBindings = resolved != null || tools != null || hostTools != null;
        const bindingResolution = shouldResolveBindings
            ? (0, derive_workflow_bindings_from_nodes_util_1.resolveWorkflowBindingsForSave)({
                nodes: nextLegacyNodes,
                explicitTools: tools,
                explicitHostTools: hostTools,
            })
            : null;
        if (bindingResolution === null || bindingResolution === void 0 ? void 0 : bindingResolution.issues.length) {
            throw new common_1.BadRequestException({
                code: 'FLOW_BINDING_RESOLUTION_FAILED',
                message: 'Flow tool bindings must come from Intent slots / compiled IR',
                issues: bindingResolution.issues,
            });
        }
        const resolvedTools = (_b = bindingResolution === null || bindingResolution === void 0 ? void 0 : bindingResolution.tools) !== null && _b !== void 0 ? _b : existing.flowTools.map((row) => ({
            toolId: row.toolId,
            isRequired: row.isRequired,
        }));
        const resolvedHostTools = (_c = bindingResolution === null || bindingResolution === void 0 ? void 0 : bindingResolution.hostTools) !== null && _c !== void 0 ? _c : existing.flowHostTools.map((row) => ({
            hostToolId: row.hostToolId,
            isRequired: row.isRequired,
        }));
        if (shouldResolveBindings) {
            await this.assertBindingsExist(existing.appClientId, resolvedTools, resolvedHostTools);
        }
        const contentChanged = intentChanged ||
            dto.deliverable != null ||
            dto.constraints != null;
        const row = await this.prisma.$transaction(async (tx) => {
            var _a, _b, _c;
            if (shouldResolveBindings) {
                await tx.flowTool.deleteMany({ where: { flowId: id } });
                if (resolvedTools.length > 0) {
                    await tx.flowTool.createMany({
                        data: resolvedTools.map((item) => {
                            var _a;
                            return ({
                                flowId: id,
                                toolId: item.toolId,
                                isRequired: (_a = item.isRequired) !== null && _a !== void 0 ? _a : false,
                            });
                        }),
                    });
                }
                await tx.flowHostTool.deleteMany({ where: { flowId: id } });
                if (resolvedHostTools.length > 0) {
                    await tx.flowHostTool.createMany({
                        data: resolvedHostTools.map((item) => {
                            var _a;
                            return ({
                                flowId: id,
                                hostToolId: item.hostToolId,
                                isRequired: (_a = item.isRequired) !== null && _a !== void 0 ? _a : false,
                            });
                        }),
                    });
                }
            }
            const nextVersion = contentChanged
                ? existing.version + 1
                : existing.version;
            const updated = await tx.flow.update({
                where: { id },
                data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (dto.name != null ? { name: dto.name.trim() } : {})), (dto.description !== undefined
                    ? { description: ((_a = dto.description) === null || _a === void 0 ? void 0 : _a.trim()) || null }
                    : {})), (dto.goal !== undefined ? { goal: ((_b = dto.goal) === null || _b === void 0 ? void 0 : _b.trim()) || null } : {})), (dto.deliverable != null ? { deliverable: dto.deliverable } : {})), (resolved != null
                    ? {
                        intent: resolved.intent,
                        ir: resolved.ir,
                    }
                    : {})), (dto.constraints != null
                    ? { constraints: dto.constraints }
                    : {})), (dto.isActive != null ? { isActive: dto.isActive } : {})), (dto.sortOrder != null ? { sortOrder: dto.sortOrder } : {})), (contentChanged ? { version: nextVersion } : {})),
                include: flow_types_1.FLOW_DETAIL_INCLUDE,
            });
            if (contentChanged) {
                await tx.flowRevision.create({
                    data: {
                        flowId: id,
                        version: nextVersion,
                        intent: updated.intent,
                        ir: updated.ir,
                        deliverable: updated.deliverable,
                        constraints: updated.constraints,
                        changeNote: ((_c = dto.changeNote) === null || _c === void 0 ? void 0 : _c.trim()) || null,
                    },
                });
            }
            return updated;
        });
        return (0, flow_mapper_1.toFlowResponse)(row);
    }
    async listPresets(profile) {
        return (0, workflow_preset_util_1.listWorkflowPresetCatalog)(profile);
    }
    allocateIntentStateKeys(labels) {
        return { keys: (0, workflow_intent_state_key_util_1.allocateWorkflowIntentStateKeys)(labels) };
    }
    async findOne(id) {
        return (0, flow_mapper_1.toFlowResponse)(await this.findEntityOrThrow(id));
    }
    async listRevisions(flowId, query = {}) {
        var _a;
        const flow = await this.findEntityOrThrow(flowId);
        const limit = Math.min(Math.max((_a = query.limit) !== null && _a !== void 0 ? _a : 20, 1), 100);
        if (query.summary) {
            const rows = await this.prisma.flowRevision.findMany({
                where: { flowId },
                orderBy: { version: 'desc' },
                take: limit,
                select: {
                    id: true,
                    flowId: true,
                    version: true,
                    deliverable: true,
                    changeNote: true,
                    createdAt: true,
                },
            });
            return rows.map((row) => (0, flow_mapper_1.toFlowRevisionSummaryResponse)(row, flow.version));
        }
        const rows = await this.prisma.flowRevision.findMany({
            where: { flowId },
            orderBy: { version: 'desc' },
            take: limit,
        });
        return rows.map((row) => (0, flow_mapper_1.toFlowRevisionResponse)(row, flow.version));
    }
    async findRevision(flowId, version) {
        const flow = await this.findEntityOrThrow(flowId);
        const row = await this.prisma.flowRevision.findUnique({
            where: {
                flowId_version: { flowId, version },
            },
        });
        if (!row) {
            throw new common_1.NotFoundException({
                code: 'FLOW_REVISION_NOT_FOUND',
                message: `Flow ${flowId} revision version=${version} not found`,
            });
        }
        return (0, flow_mapper_1.toFlowRevisionResponse)(row, flow.version);
    }
    async remove(id) {
        await this.findEntityOrThrow(id);
        const [pendingApprovals, skillBindings, pageActionBindings, activePageActionRuns,] = await Promise.all([
            this.prisma.approvalRequest.count({
                where: { flowId: id, status: 'pending' },
            }),
            this.prisma.skill.count({ where: { flowId: id } }),
            this.prisma.pageAction.count({ where: { flowId: id } }),
            this.prisma.pageActionRun.count({
                where: {
                    flowId: id,
                    status: { in: ['running', 'awaiting_approval'] },
                },
            }),
        ]);
        if (pendingApprovals > 0) {
            throw new common_1.ConflictException({
                code: 'FLOW_HAS_PENDING_APPROVALS',
                message: `Flow ${id} has ${pendingApprovals} pending approval(s); resolve or cancel them before delete`,
            });
        }
        if (activePageActionRuns > 0) {
            throw new common_1.ConflictException({
                code: 'FLOW_HAS_ACTIVE_RUNS',
                message: `Flow ${id} has ${activePageActionRuns} in-flight PageActionRun(s); wait for completion before delete`,
            });
        }
        if (skillBindings > 0 || pageActionBindings > 0) {
            throw new common_1.ConflictException({
                code: 'FLOW_STILL_BOUND',
                message: `Flow ${id} is still bound by ${skillBindings} skill(s) and ${pageActionBindings} pageAction(s); unbind first`,
            });
        }
        await this.prisma.flow.delete({ where: { id } });
        return { ok: true, id };
    }
    async assertFlowReferenceCompatible(input) {
        const flow = await this.prisma.flow.findFirst({
            where: {
                id: input.flowId,
                appClientId: input.appClientId,
                isActive: true,
            },
            select: { id: true },
        });
        if (!flow) {
            throw new common_1.BadRequestException(`Flow ${input.flowId} is not found or inactive for this AppClient`);
        }
    }
    async assertSkillFlowBindingsCompatible(input) {
        var _a;
        const flow = await this.prisma.flow.findFirst({
            where: {
                id: input.flowId,
                appClientId: input.appClientId,
                isActive: true,
            },
            select: { id: true, version: true },
        });
        if (!flow) {
            throw new common_1.BadRequestException(`Flow ${input.flowId} is not found or inactive for this AppClient`);
        }
        const pinVersion = (_a = input.flowVersion) !== null && _a !== void 0 ? _a : null;
        if (pinVersion != null && pinVersion !== flow.version) {
            const revision = await this.prisma.flowRevision.findUnique({
                where: {
                    flowId_version: { flowId: flow.id, version: pinVersion },
                },
                select: { id: true },
            });
            if (!revision) {
                throw new common_1.BadRequestException(`Flow ${input.flowId} revision version=${pinVersion} not found`);
            }
        }
    }
    async assertPageActionFlowBindingsCompatible(input) {
        await this.assertSkillFlowBindingsCompatible(input);
    }
    async findPage(query) {
        var _a;
        const { page, pageSize, skip, take } = (0, pagination_1.resolvePagination)(query.page, query.pageSize);
        const where = Object.assign(Object.assign(Object.assign(Object.assign({}, (query.appClientId != null ? { appClientId: query.appClientId } : {})), (query.profile != null ? { profile: query.profile } : {})), (query.isActive != null ? { isActive: query.isActive } : {})), (((_a = query.keyword) === null || _a === void 0 ? void 0 : _a.trim())
            ? {
                OR: [
                    { flowKey: { contains: query.keyword.trim() } },
                    { name: { contains: query.keyword.trim() } },
                ],
            }
            : {}));
        const [rows, total] = await this.prisma.$transaction([
            this.prisma.flow.findMany({
                where,
                include: flow_types_1.FLOW_LIST_INCLUDE,
                orderBy: [{ sortOrder: 'asc' }, { id: 'desc' }],
                skip,
                take,
            }),
            this.prisma.flow.count({ where }),
        ]);
        return (0, pagination_1.toPaginatedResult)(rows.map(flow_mapper_1.toFlowListItem), total, page, pageSize);
    }
    legacyNodesFromIr(ir) {
        const doc = (0, parse_workflow_ir_util_1.parseWorkflowIrDocument)(ir);
        if (!doc) {
            return [];
        }
        return (0, materialize_workflow_graph_from_ir_util_1.materializeWorkflowGraphFromIr)(doc).nodes;
    }
    assertFlowValid(input) {
        var _a;
        const issues = (0, validate_workflow_util_1.validateWorkflowDefinition)({
            definition: {
                workflowKey: input.flowKey,
                name: input.name,
                profile: input.profile,
                goal: (_a = input.goal) !== null && _a !== void 0 ? _a : null,
                constraints: input.constraints,
                nodes: input.legacyNodes,
                edges: input.legacyEdges,
                entryNodeId: input.entryNodeId,
            },
            bindings: {
                toolIds: input.toolIds,
                hostToolIds: input.hostToolIds,
            },
        });
        if (issues.length > 0) {
            throw new common_1.BadRequestException({
                code: 'FLOW_DEFINITION_INVALID',
                message: 'Compiled Flow IR failed legacy executor validation',
                issues,
            });
        }
    }
    async findEntityOrThrow(id) {
        const row = await this.prisma.flow.findUnique({
            where: { id },
            include: flow_types_1.FLOW_DETAIL_INCLUDE,
        });
        if (!row) {
            throw new common_1.NotFoundException(`Flow ${id} not found`);
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
    normalizeToolBindings(tools) {
        return tools.map((item) => {
            var _a;
            return ({
                toolId: item.toolId,
                isRequired: (_a = item.isRequired) !== null && _a !== void 0 ? _a : false,
            });
        });
    }
    normalizeHostToolBindings(hostTools) {
        return hostTools.map((item) => {
            var _a;
            return ({
                hostToolId: item.hostToolId,
                isRequired: (_a = item.isRequired) !== null && _a !== void 0 ? _a : false,
            });
        });
    }
    async assertBindingsExist(appClientId, tools, hostTools) {
        if (tools.length) {
            const count = await this.prisma.tool.count({
                where: {
                    appClientId,
                    id: { in: tools.map((t) => t.toolId) },
                },
            });
            if (count !== new Set(tools.map((t) => t.toolId)).size) {
                throw new common_1.BadRequestException({
                    code: 'FLOW_TOOL_NOT_FOUND',
                    message: 'One or more tools not found in AppClient',
                });
            }
        }
        if (hostTools.length) {
            const count = await this.prisma.hostTool.count({
                where: {
                    appClientId,
                    id: { in: hostTools.map((h) => h.hostToolId) },
                },
            });
            if (count !== new Set(hostTools.map((h) => h.hostToolId)).size) {
                throw new common_1.BadRequestException({
                    code: 'FLOW_HOST_TOOL_NOT_FOUND',
                    message: 'One or more host tools not found in AppClient',
                });
            }
        }
    }
};
FlowService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FlowService);
exports.FlowService = FlowService;
//# sourceMappingURL=flow.service.js.map