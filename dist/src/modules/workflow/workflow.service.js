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
const derive_workflow_bindings_from_nodes_util_1 = require("../../core/workflow/derive-workflow-bindings-from-nodes.util");
const validate_skill_workflow_binding_util_1 = require("../../core/workflow/validate-skill-workflow-binding.util");
const validate_page_action_workflow_binding_util_1 = require("../../core/workflow/validate-page-action-workflow-binding.util");
const validate_workflow_util_1 = require("../../core/workflow/validate-workflow.util");
const workflow_preset_util_1 = require("../../core/workflow/workflow-preset.util");
const prisma_service_1 = require("../../prisma/prisma.service");
const workflow_mapper_1 = require("./workflow.mapper");
const workflow_types_1 = require("./workflow.types");
const workflow_profile_util_1 = require("./workflow-profile.util");
let WorkflowService = class WorkflowService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        var _a, _b;
        await this.assertAppClientExists(dto.appClientId);
        const workflowKey = dto.workflowKey.trim();
        const nodes = this.resolveWorkflowNodes({
            profile: dto.profile,
            preset: dto.preset,
            presetConfig: dto.presetConfig,
            nodes: dto.nodes,
        });
        const bindingResolution = (0, derive_workflow_bindings_from_nodes_util_1.resolveWorkflowBindingsForSave)({
            nodes,
            explicitTools: dto.tools,
            explicitHostTools: dto.hostTools,
        });
        if (bindingResolution.issues.length > 0) {
            throw new common_1.BadRequestException({
                code: 'WORKFLOW_BINDING_RESOLUTION_FAILED',
                message: 'Workflow tool bindings must be declared on node input.toolId / input.hostToolId; tools[] and hostTools[] may only set isRequired for those ids',
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
            bindings: this.toBindingRefs(tools, hostTools),
        });
        await this.assertBindingsExist(dto.appClientId, tools, hostTools);
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
                        nodes: nodes,
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
        var _a, _b, _c, _d, _e;
        const existing = await this.findEntityOrThrow(id);
        if (dto.preset != null &&
            dto.nodes != null &&
            dto.nodes.length > 0) {
            throw new common_1.BadRequestException({
                code: 'WORKFLOW_PRESET_NODES_CONFLICT',
                message: 'Provide either preset + presetConfig or nodes, not both',
            });
        }
        const expandedFromPreset = dto.preset != null
            ? this.resolveWorkflowNodes({
                profile: existing.profile,
                preset: dto.preset,
                presetConfig: dto.presetConfig,
            })
            : null;
        const nodes = expandedFromPreset != null
            ? expandedFromPreset
            : dto.nodes != null
                ? (0, load_workflow_definition_util_1.parseWorkflowNodesJson)(dto.nodes)
                : undefined;
        const tools = dto.tools != null ? this.normalizeToolBindings(dto.tools) : undefined;
        const hostTools = dto.hostTools != null
            ? this.normalizeHostToolBindings(dto.hostTools)
            : undefined;
        if (dto.isActive === false) {
            await this.assertCanDeactivate(id);
        }
        const nextNodes = nodes !== null && nodes !== void 0 ? nodes : (0, load_workflow_definition_util_1.parseWorkflowNodesJson)(existing.nodes);
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
                message: 'Workflow tool bindings must be declared on node input.toolId / input.hostToolId; tools[] and hostTools[] may only set isRequired for those ids',
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
            bindings: nextBindings,
        });
        if (shouldResolveBindings) {
            await this.assertBindingsExist(existing.appClientId, resolvedTools, resolvedHostTools);
        }
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
                    : {})), (dto.goal !== undefined ? { goal: ((_b = dto.goal) === null || _b === void 0 ? void 0 : _b.trim()) || null } : {})), (dto.deliverable != null ? { deliverable: dto.deliverable } : {})), (nodes != null
                    ? { nodes: nodes }
                    : {})), (dto.constraints != null
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
    async listRevisions(workflowId, limit = 20) {
        await this.findEntityOrThrow(workflowId);
        const rows = await this.prisma.workflowRevision.findMany({
            where: { workflowId },
            orderBy: { version: 'desc' },
            take: Math.min(Math.max(limit, 1), 100),
        });
        return rows.map(workflow_mapper_1.toWorkflowRevisionResponse);
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
        if (!(0, workflow_profile_util_1.isWorkflowProfileCompatibleWithEntry)(workflow.profile, input.entry)) {
            throw new common_1.BadRequestException(`Workflow profile ${workflow.profile} is not compatible with ${input.entry}`);
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
            include: {
                workflowTools: true,
                workflowHostTools: true,
            },
        });
        if (!workflow) {
            throw new common_1.BadRequestException(`Workflow ${input.workflowId} is not found or inactive for this AppClient`);
        }
        let nodesJson = workflow.nodes;
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
            nodesJson = revision.nodes;
        }
        const nodes = (0, load_workflow_definition_util_1.parseWorkflowNodesJson)(nodesJson);
        const nodeRefs = (0, derive_workflow_bindings_from_nodes_util_1.collectWorkflowNodeBindingRefs)(nodes);
        const workflowToolIds = [
            ...new Set([
                ...workflow.workflowTools.map((row) => row.toolId),
                ...nodeRefs.toolIds,
            ]),
        ];
        const workflowHostToolIds = [
            ...new Set([
                ...workflow.workflowHostTools.map((row) => row.hostToolId),
                ...nodeRefs.hostToolIds,
            ]),
        ];
        const issues = (0, validate_skill_workflow_binding_util_1.validateSkillWorkflowBinding)({
            nodes,
            workflowToolIds,
            workflowHostToolIds,
            skillToolIds: input.skillToolIds,
            skillHostToolIds: input.skillHostToolIds,
        });
        if (issues.length > 0) {
            throw new common_1.BadRequestException({
                code: 'SKILL_WORKFLOW_BINDING_INCOMPATIBLE',
                message: 'Skill tool bindings do not cover Workflow requirements; align SkillTool / SkillHostTool with WorkflowTool / WorkflowHostTool',
                workflowId: input.workflowId,
                issues,
            });
        }
    }
    async assertPageActionWorkflowBindingsCompatible(input) {
        var _a;
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
        let nodesJson = workflow.nodes;
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
            nodesJson = revision.nodes;
        }
        const nodes = (0, load_workflow_definition_util_1.parseWorkflowNodesJson)(nodesJson);
        const issues = (0, validate_page_action_workflow_binding_util_1.validatePageActionWorkflowBinding)({
            pageActionHostToolId: input.pageActionHostToolId,
            nodes,
        });
        if (issues.length > 0) {
            throw new common_1.BadRequestException({
                code: 'PAGE_ACTION_WORKFLOW_BINDING_INCOMPATIBLE',
                message: 'PageAction.hostToolId must match generate_and_push node input.hostToolId on the bound Workflow',
                workflowId: input.workflowId,
                issues,
            });
        }
    }
    async assertReferencingSkillsStillCompatible(workflowId) {
        var _a;
        const workflow = await this.findEntityOrThrow(workflowId);
        const nodes = (0, load_workflow_definition_util_1.parseWorkflowNodesJson)(workflow.nodes);
        const nodeRefs = (0, derive_workflow_bindings_from_nodes_util_1.collectWorkflowNodeBindingRefs)(nodes);
        const workflowToolIds = [
            ...new Set([
                ...workflow.workflowTools.map((row) => row.toolId),
                ...nodeRefs.toolIds,
            ]),
        ];
        const workflowHostToolIds = [
            ...new Set([
                ...workflow.workflowHostTools.map((row) => row.hostToolId),
                ...nodeRefs.hostToolIds,
            ]),
        ];
        const skills = await this.prisma.skill.findMany({
            where: { workflowId, isActive: true },
            select: {
                id: true,
                name: true,
                workflowVersion: true,
                skillTools: { select: { toolId: true } },
                skillHostTools: { select: { hostToolId: true } },
            },
        });
        for (const skill of skills) {
            let skillNodes = nodes;
            const pinVersion = (_a = skill.workflowVersion) !== null && _a !== void 0 ? _a : null;
            if (pinVersion != null && pinVersion !== workflow.version) {
                const revision = await this.prisma.workflowRevision.findUnique({
                    where: {
                        workflowId_version: {
                            workflowId: workflow.id,
                            version: pinVersion,
                        },
                    },
                });
                if (revision) {
                    skillNodes = (0, load_workflow_definition_util_1.parseWorkflowNodesJson)(revision.nodes);
                }
            }
            const issues = (0, validate_skill_workflow_binding_util_1.validateSkillWorkflowBinding)({
                nodes: skillNodes,
                workflowToolIds,
                workflowHostToolIds,
                skillToolIds: skill.skillTools.map((row) => row.toolId),
                skillHostToolIds: skill.skillHostTools.map((row) => row.hostToolId),
            });
            if (issues.length > 0) {
                throw new common_1.BadRequestException({
                    code: 'WORKFLOW_CHANGE_BREAKS_SKILL_REFERENCES',
                    message: `Workflow update is incompatible with Skill id=${skill.id} (${skill.name})`,
                    workflowId,
                    skillId: skill.id,
                    issues,
                });
            }
        }
    }
    async assertReferencingPageActionsStillCompatible(workflowId) {
        var _a;
        const workflow = await this.findEntityOrThrow(workflowId);
        const nodes = (0, load_workflow_definition_util_1.parseWorkflowNodesJson)(workflow.nodes);
        const pageActions = await this.prisma.pageAction.findMany({
            where: { workflowId, isActive: true },
            select: {
                id: true,
                name: true,
                hostToolId: true,
                workflowVersion: true,
            },
        });
        for (const pageAction of pageActions) {
            let actionNodes = nodes;
            const pinVersion = (_a = pageAction.workflowVersion) !== null && _a !== void 0 ? _a : null;
            if (pinVersion != null && pinVersion !== workflow.version) {
                const revision = await this.prisma.workflowRevision.findUnique({
                    where: {
                        workflowId_version: {
                            workflowId: workflow.id,
                            version: pinVersion,
                        },
                    },
                });
                if (revision) {
                    actionNodes = (0, load_workflow_definition_util_1.parseWorkflowNodesJson)(revision.nodes);
                }
            }
            const issues = (0, validate_page_action_workflow_binding_util_1.validatePageActionWorkflowBinding)({
                pageActionHostToolId: pageAction.hostToolId,
                nodes: actionNodes,
            });
            if (issues.length > 0) {
                throw new common_1.BadRequestException({
                    code: 'WORKFLOW_CHANGE_BREAKS_PAGE_ACTION_REFERENCES',
                    message: `Workflow update is incompatible with PageAction id=${pageAction.id} (${pageAction.name})`,
                    workflowId,
                    pageActionId: pageAction.id,
                    issues,
                });
            }
        }
    }
    resolveWorkflowNodes(input) {
        var _a;
        if (input.preset != null && input.nodes != null && input.nodes.length > 0) {
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
            return (0, workflow_preset_util_1.expandWorkflowPreset)({
                preset: input.preset,
                profile: input.profile,
                config,
            });
        }
        if (!((_a = input.nodes) === null || _a === void 0 ? void 0 : _a.length)) {
            throw new common_1.BadRequestException({
                code: 'WORKFLOW_NODES_REQUIRED',
                message: 'Either preset or nodes must be provided',
            });
        }
        return (0, load_workflow_definition_util_1.parseWorkflowNodesJson)(input.nodes);
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
            definition: {
                workflowKey: input.workflowKey,
                name: input.name,
                profile: input.profile,
                goal: input.goal,
                constraints: input.constraints,
                nodes: input.nodes,
            },
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