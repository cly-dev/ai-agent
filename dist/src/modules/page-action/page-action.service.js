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
exports.PageActionService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("../../../generated/prisma/client");
const pagination_1 = require("../../common/pagination");
const page_action_host_fill_executor_1 = require("../../core/page-action/page-action-host-fill.executor");
const page_workflow_orchestrator_1 = require("../../core/page-action/page-workflow-orchestrator");
const approval_gate_service_1 = require("../../core/approval/approval-gate.service");
const approval_trigger_permission_service_1 = require("../../core/approval/approval-trigger-permission.service");
const resolve_approval_parties_util_1 = require("../../core/approval/resolve-approval-parties.util");
const load_workflow_definition_util_1 = require("../../core/workflow/load-workflow-definition.util");
const page_action_workflow_load_util_1 = require("../../core/page-action/page-action-workflow-load.util");
const page_action_host_tool_util_1 = require("../../core/page-action/page-action-host-tool.util");
const page_action_host_tool_provision_util_1 = require("../../core/page-action/page-action-host-tool-provision.util");
const page_action_inline_sse_util_1 = require("../../core/page-action/page-action-inline-sse.util");
const page_action_run_steps_util_1 = require("../../core/page-action/page-action-run-steps.util");
const page_action_constants_1 = require("../../core/page-action/page-action.constants");
const page_action_prompt_util_1 = require("../../core/page-action/page-action-prompt.util");
const host_bridge_1 = require("../../core/host-bridge");
const llm_service_1 = require("../../core/llm/llm.service");
const tool_engine_service_1 = require("../../core/tool-engine/tool-engine.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const host_tool_types_1 = require("../host-tool/host-tool.types");
const page_action_mapper_1 = require("./page-action.mapper");
const page_action_types_1 = require("./page-action.types");
const workflow_service_1 = require("../workflow/workflow.service");
const page_action_workflow_host_util_1 = require("../../core/page-action/page-action-workflow-host.util");
let PageActionService = class PageActionService {
    constructor(prisma, llmService, toolEngine, workflowService, approvalGate, triggerPermission) {
        this.prisma = prisma;
        this.llmService = llmService;
        this.toolEngine = toolEngine;
        this.workflowService = workflowService;
        this.approvalGate = approvalGate;
        this.triggerPermission = triggerPermission;
    }
    async create(dto) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        await this.assertAppClientExists(dto.appClientId);
        this.assertInlineStreamOnly(dto.defaultDelivery);
        const actionKey = dto.actionKey.trim();
        this.assertPromptLimits(dto.systemPrompt, null);
        const workflowBound = dto.workflowId != null && dto.workflowId > 0;
        let hostToolId = null;
        if (workflowBound) {
            await this.workflowService.assertWorkflowReferenceCompatible({
                workflowId: dto.workflowId,
                appClientId: dto.appClientId,
                entry: 'page_action',
            });
            if (dto.hostToolId != null) {
                await this.assertHostToolForApp(dto.appClientId, dto.hostToolId);
                hostToolId = dto.hostToolId;
            }
            else if (dto.hostTool != null) {
                const hostTool = await (0, page_action_host_tool_provision_util_1.resolveOrProvisionPageActionHostTool)(this.prisma, {
                    appClientId: dto.appClientId,
                    actionKey: dto.actionKey,
                    pageActionName: dto.name,
                    pageActionDescription: dto.description,
                    pageScope: dto.pageScope,
                    hostToolId: undefined,
                    hostTool: dto.hostTool,
                });
                hostToolId = hostTool.id;
            }
            await this.workflowService.assertPageActionWorkflowBindingsCompatible({
                workflowId: dto.workflowId,
                appClientId: dto.appClientId,
                workflowVersion: dto.workflowVersion,
                pageActionHostToolId: hostToolId,
            });
        }
        else {
            const hostTool = await (0, page_action_host_tool_provision_util_1.resolveOrProvisionPageActionHostTool)(this.prisma, {
                appClientId: dto.appClientId,
                actionKey: dto.actionKey,
                pageActionName: dto.name,
                pageActionDescription: dto.description,
                pageScope: dto.pageScope,
                hostToolId: dto.hostToolId,
                hostTool: dto.hostTool,
            });
            hostToolId = hostTool.id;
        }
        try {
            const row = await this.prisma.pageAction.create({
                data: {
                    appClientId: dto.appClientId,
                    actionKey,
                    name: dto.name.trim(),
                    description: ((_a = dto.description) === null || _a === void 0 ? void 0 : _a.trim()) || null,
                    hostToolId,
                    pageScope: ((_b = dto.pageScope) === null || _b === void 0 ? void 0 : _b.trim()) || null,
                    systemPrompt: dto.systemPrompt.trim(),
                    defaultDelivery: client_1.PageActionDelivery.inline_stream,
                    allowCustomInstruction: (_c = dto.allowCustomInstruction) !== null && _c !== void 0 ? _c : true,
                    isActive: (_d = dto.isActive) !== null && _d !== void 0 ? _d : true,
                    sortOrder: (_e = dto.sortOrder) !== null && _e !== void 0 ? _e : 0,
                    config: dto.config === undefined
                        ? undefined
                        : dto.config,
                    sourceSkillId: (_f = dto.sourceSkillId) !== null && _f !== void 0 ? _f : null,
                    workflowId: (_g = dto.workflowId) !== null && _g !== void 0 ? _g : undefined,
                    workflowVersion: (_h = dto.workflowVersion) !== null && _h !== void 0 ? _h : undefined,
                    workflowOverrides: dto.workflowOverrides === undefined
                        ? undefined
                        : dto.workflowOverrides === null
                            ? client_1.Prisma.JsonNull
                            : dto.workflowOverrides,
                },
                include: page_action_types_1.PAGE_ACTION_DETAIL_INCLUDE,
            });
            return (0, page_action_mapper_1.toPageActionResponse)(row);
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                throw new common_1.ConflictException(`PageAction actionKey "${actionKey}" already exists for this AppClient`);
            }
            throw error;
        }
    }
    async update(id, dto) {
        var _a, _b, _c;
        this.assertInlineStreamOnly(dto.defaultDelivery);
        const existing = await this.findEntityOrThrow(id);
        if (dto.hostToolId != null) {
            await this.assertHostToolForApp(existing.appClientId, dto.hostToolId);
        }
        if (dto.systemPrompt != null) {
            this.assertPromptLimits(dto.systemPrompt, null);
        }
        if (dto.workflowId != null) {
            await this.workflowService.assertWorkflowReferenceCompatible({
                workflowId: dto.workflowId,
                appClientId: existing.appClientId,
                entry: 'page_action',
            });
        }
        const nextWorkflowId = dto.workflowId !== undefined ? dto.workflowId : existing.workflowId;
        const nextWorkflowVersion = dto.workflowVersion !== undefined
            ? dto.workflowVersion
            : existing.workflowVersion;
        const nextHostToolId = (_a = dto.hostToolId) !== null && _a !== void 0 ? _a : existing.hostToolId;
        if (nextWorkflowId != null && nextWorkflowId > 0) {
            await this.workflowService.assertPageActionWorkflowBindingsCompatible({
                workflowId: nextWorkflowId,
                appClientId: existing.appClientId,
                workflowVersion: nextWorkflowVersion,
                pageActionHostToolId: nextHostToolId,
            });
        }
        const row = await this.prisma.pageAction.update({
            where: { id },
            data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (dto.name != null ? { name: dto.name.trim() } : {})), (dto.description !== undefined
                ? { description: ((_b = dto.description) === null || _b === void 0 ? void 0 : _b.trim()) || null }
                : {})), (dto.hostToolId != null ? { hostToolId: dto.hostToolId } : {})), (dto.pageScope !== undefined
                ? { pageScope: ((_c = dto.pageScope) === null || _c === void 0 ? void 0 : _c.trim()) || null }
                : {})), (dto.systemPrompt != null
                ? { systemPrompt: dto.systemPrompt.trim() }
                : {})), (dto.defaultDelivery != null
                ? { defaultDelivery: client_1.PageActionDelivery.inline_stream }
                : {})), (dto.allowCustomInstruction != null
                ? { allowCustomInstruction: dto.allowCustomInstruction }
                : {})), (dto.isActive != null ? { isActive: dto.isActive } : {})), (dto.sortOrder != null ? { sortOrder: dto.sortOrder } : {})), (dto.config !== undefined
                ? { config: dto.config }
                : {})), (dto.workflowId !== undefined ? { workflowId: dto.workflowId } : {})), (dto.workflowVersion !== undefined
                ? { workflowVersion: dto.workflowVersion }
                : {})), (dto.workflowOverrides !== undefined
                ? {
                    workflowOverrides: dto.workflowOverrides === null
                        ? client_1.Prisma.JsonNull
                        : dto.workflowOverrides,
                }
                : {})),
            include: page_action_types_1.PAGE_ACTION_DETAIL_INCLUDE,
        });
        return (0, page_action_mapper_1.toPageActionResponse)(row);
    }
    async findOne(id) {
        const row = await this.findEntityOrThrow(id);
        return (0, page_action_mapper_1.toPageActionResponse)(row);
    }
    async findPage(query) {
        var _a, _b;
        const { page, pageSize, skip, take } = (0, pagination_1.resolvePagination)(query.page, query.pageSize);
        const where = Object.assign(Object.assign(Object.assign(Object.assign({}, (query.appClientId != null ? { appClientId: query.appClientId } : {})), (((_a = query.pageScope) === null || _a === void 0 ? void 0 : _a.trim())
            ? { pageScope: query.pageScope.trim() }
            : {})), (query.isActive != null ? { isActive: query.isActive } : {})), (((_b = query.keyword) === null || _b === void 0 ? void 0 : _b.trim())
            ? {
                OR: [
                    { actionKey: { contains: query.keyword.trim() } },
                    { name: { contains: query.keyword.trim() } },
                ],
            }
            : {}));
        const [rows, total] = await this.prisma.$transaction([
            this.prisma.pageAction.findMany({
                where,
                skip,
                take,
                orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
                include: page_action_types_1.PAGE_ACTION_DETAIL_INCLUDE,
            }),
            this.prisma.pageAction.count({ where }),
        ]);
        return (0, pagination_1.toPaginatedResult)(rows.map(page_action_mapper_1.toPageActionResponse), total, page, pageSize);
    }
    async findRunAdmin(id) {
        const run = await this.prisma.pageActionRun.findUnique({
            where: { id },
            include: page_action_types_1.PAGE_ACTION_RUN_ADMIN_INCLUDE,
        });
        if (!run) {
            throw new common_1.NotFoundException(`PageActionRun ${id} not found`);
        }
        return (0, page_action_mapper_1.toPageActionRunAdminDetail)(run);
    }
    async findRunPageAdmin(appClientId, query) {
        var _a, _b;
        const { page, pageSize, skip, take } = (0, pagination_1.resolvePagination)(query.page, query.pageSize);
        const where = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ appClientId }, (query.pageActionId != null ? { pageActionId: query.pageActionId } : {})), (query.userId != null ? { userId: query.userId } : {})), (query.status != null ? { status: query.status } : {})), (((_a = query.clientActionId) === null || _a === void 0 ? void 0 : _a.trim())
            ? { clientActionId: query.clientActionId.trim() }
            : {})), (((_b = query.actionKey) === null || _b === void 0 ? void 0 : _b.trim())
            ? {
                pageAction: {
                    actionKey: { contains: query.actionKey.trim() },
                },
            }
            : {}));
        const [rows, total] = await this.prisma.$transaction([
            this.prisma.pageActionRun.findMany({
                where,
                skip,
                take,
                orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
                include: page_action_types_1.PAGE_ACTION_RUN_ADMIN_INCLUDE,
            }),
            this.prisma.pageActionRun.count({ where }),
        ]);
        return (0, pagination_1.toPaginatedResult)(rows.map(page_action_mapper_1.toPageActionRunAdminListItem), total, page, pageSize);
    }
    async invoke(userId, appClientId, dto, res) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
        const actionKey = dto.actionKey.trim();
        const pageAction = await this.prisma.pageAction.findFirst({
            where: { appClientId, actionKey, isActive: true },
            include: page_action_types_1.PAGE_ACTION_DETAIL_INCLUDE,
        });
        if (!pageAction) {
            throw new common_1.NotFoundException({
                code: 'PAGE_ACTION_NOT_FOUND',
                message: `PageAction "${actionKey}" is not registered or inactive`,
            });
        }
        const hostToolRow = await (0, page_action_workflow_host_util_1.resolvePageActionHostToolRow)(this.prisma, pageAction);
        if (hostToolRow && !hostToolRow.isActive) {
            throw new common_1.BadRequestException({
                code: 'HOST_TOOL_INACTIVE',
                message: `Bound HostTool "${hostToolRow.name}" is inactive`,
            });
        }
        const pageContext = this.resolvePageContext(dto);
        (0, page_action_host_tool_util_1.assertPageActionScopeMatch)({
            pageScope: pageAction.pageScope,
            hostPageScope: (_b = (_a = hostToolRow === null || hostToolRow === void 0 ? void 0 : hostToolRow.hostPage) === null || _a === void 0 ? void 0 : _a.scope) !== null && _b !== void 0 ? _b : null,
            pageContext,
        });
        const instruction = pageAction.allowCustomInstruction
            ? ((_c = dto.instruction) === null || _c === void 0 ? void 0 : _c.trim()) || null
            : null;
        this.assertPromptLimits(pageAction.systemPrompt, instruction, dto.context);
        const hostToolResolved = hostToolRow
            ? (0, page_action_host_tool_util_1.resolvePageActionHostTool)(hostToolRow, pageContext)
            : null;
        if ((_d = dto.idempotencyKey) === null || _d === void 0 ? void 0 : _d.trim()) {
            const prior = await this.prisma.pageActionRun.findFirst({
                where: {
                    appClientId,
                    idempotencyKey: dto.idempotencyKey.trim(),
                    status: client_1.PageActionRunStatus.completed,
                },
                include: { pageAction: { select: { actionKey: true } } },
            });
            if (prior && prior.pageActionId === pageAction.id) {
                (0, page_action_inline_sse_util_1.initInlineSseResponse)(res);
                const replaySteps = await (0, page_action_host_fill_executor_1.replayPageActionInlineStream)({
                    res,
                    actionRunId: prior.id,
                    actionKey: prior.pageAction.actionKey,
                    generation: prior.generation,
                    clientActionId: prior.clientActionId,
                    fillText: prior.fillText,
                    dslOutcome: prior.dslOutcome,
                    streamId: prior.streamId,
                    pageContext,
                    hostTool: hostToolResolved,
                });
                void replaySteps;
                return;
            }
        }
        const messages = (0, page_action_prompt_util_1.buildPageActionLlmMessages)({
            systemPrompt: pageAction.systemPrompt,
            instruction,
            context: (_e = dto.context) !== null && _e !== void 0 ? _e : null,
            pageContext,
        });
        const run = await this.prisma.pageActionRun.create({
            data: {
                pageActionId: pageAction.id,
                appClientId,
                userId,
                delivery: client_1.PageActionDelivery.inline_stream,
                status: client_1.PageActionRunStatus.running,
                instruction,
                context: dto.context === undefined
                    ? undefined
                    : dto.context,
                pageContext: pageContext,
                idempotencyKey: ((_f = dto.idempotencyKey) === null || _f === void 0 ? void 0 : _f.trim()) || null,
                clientActionId: ((_g = dto.clientActionId) === null || _g === void 0 ? void 0 : _g.trim()) || null,
                steps: [],
            },
        });
        await this.prisma.pageActionRun.update({
            where: { id: run.id },
            data: { generation: run.id },
        });
        const generation = run.id;
        const startedAt = Date.now();
        const stepRecorder = new page_action_run_steps_util_1.PageActionRunStepRecorder();
        try {
            if (pageAction.workflowId) {
                const loadResult = await (0, load_workflow_definition_util_1.loadWorkflowForRunDetailed)(this.prisma, {
                    workflowId: pageAction.workflowId,
                    appClientId,
                    workflowVersion: pageAction.workflowVersion,
                    workflowOverrides: (0, load_workflow_definition_util_1.parseWorkflowOverridesJson)(pageAction.workflowOverrides),
                });
                if (loadResult.status === 'failed') {
                    const errorCode = (0, page_action_workflow_load_util_1.pageActionWorkflowLoadErrorCode)(loadResult.reason);
                    const errorMessage = (0, page_action_workflow_load_util_1.pageActionWorkflowLoadFailureMessage)(loadResult.reason);
                    (0, page_action_inline_sse_util_1.initInlineSseResponse)(res);
                    (0, page_action_inline_sse_util_1.writePageActionLifecycle)(res, {
                        phase: 'failed',
                        actionRunId: run.id,
                        actionKey: pageAction.actionKey,
                        delivery: client_1.PageActionDelivery.inline_stream,
                        generation,
                        clientActionId: ((_h = dto.clientActionId) === null || _h === void 0 ? void 0 : _h.trim()) || null,
                        errorCode,
                        errorMessage,
                    }, stepRecorder);
                    (0, page_action_inline_sse_util_1.endInlineSseResponse)(res);
                    await this.prisma.pageActionRun.update({
                        where: { id: run.id },
                        data: {
                            status: client_1.PageActionRunStatus.failed,
                            workflowId: loadResult.workflowId,
                            errorCode,
                            errorMessage,
                            durationMs: Date.now() - startedAt,
                            finishedAt: new Date(),
                            steps: stepRecorder.toJson(),
                        },
                    });
                    return;
                }
                (0, page_action_inline_sse_util_1.initInlineSseResponse)(res);
                const allowedToolIds = await this.triggerPermission.resolveUserAllowedToolIdsForApp({
                    userId,
                    appClientId,
                });
                const permission = this.triggerPermission.evaluateForNodes({
                    nodes: loadResult.nodes,
                    allowedToolIds,
                });
                if (permission.allowed === false) {
                    const errorCode = 'WORKFLOW_TRIGGER_PERMISSION_DENIED';
                    const errorMessage = `Missing write tool permission: ${permission.missingToolIds.join(',')}`;
                    (0, page_action_inline_sse_util_1.writePageActionLifecycle)(res, {
                        phase: 'failed',
                        actionRunId: run.id,
                        actionKey: pageAction.actionKey,
                        delivery: client_1.PageActionDelivery.inline_stream,
                        generation,
                        clientActionId: ((_j = dto.clientActionId) === null || _j === void 0 ? void 0 : _j.trim()) || null,
                        errorCode,
                        errorMessage,
                    }, stepRecorder);
                    (0, page_action_inline_sse_util_1.endInlineSseResponse)(res);
                    await this.prisma.pageActionRun.update({
                        where: { id: run.id },
                        data: {
                            status: client_1.PageActionRunStatus.failed,
                            workflowId: loadResult.workflowId,
                            errorCode,
                            errorMessage,
                            durationMs: Date.now() - startedAt,
                            finishedAt: new Date(),
                            steps: stepRecorder.toJson(),
                        },
                    });
                    return;
                }
                const result = await (0, page_workflow_orchestrator_1.orchestratePageWorkflow)({
                    workflowId: loadResult.workflowId,
                    version: loadResult.version,
                    nodes: loadResult.nodes,
                    systemPrompt: pageAction.systemPrompt,
                    objectivePrefix: instruction,
                    messages,
                    pageContext,
                    hostTool: hostToolResolved,
                    llmService: this.llmService,
                    prisma: this.prisma,
                    toolEngine: this.toolEngine,
                    userId,
                    appClientId,
                    actionRunId: run.id,
                    actionKey: pageAction.actionKey,
                    generation,
                    clientActionId: ((_k = dto.clientActionId) === null || _k === void 0 ? void 0 : _k.trim()) || null,
                    res,
                    stepRecorder,
                    allowedToolIds,
                    approvalGate: this.approvalGate,
                    approvalTriggerBinding: (0, resolve_approval_parties_util_1.parseApprovalTriggerBinding)(pageAction.config),
                });
                if (result.suspended) {
                    (0, page_action_inline_sse_util_1.writePageActionLifecycle)(res, {
                        phase: 'awaiting_approval',
                        actionRunId: run.id,
                        actionKey: pageAction.actionKey,
                        delivery: client_1.PageActionDelivery.inline_stream,
                        generation,
                        clientActionId: ((_l = dto.clientActionId) === null || _l === void 0 ? void 0 : _l.trim()) || null,
                    }, stepRecorder);
                    (0, page_action_inline_sse_util_1.endInlineSseResponse)(res);
                    await this.prisma.pageActionRun.update({
                        where: { id: run.id },
                        data: {
                            workflowId: loadResult.workflowId,
                            workflowVersion: loadResult.version,
                            workflowRun: result.workflowRun,
                            status: client_1.PageActionRunStatus.awaiting_approval,
                            fillText: result.fillText || null,
                            dslOutcome: result.dslOutcome,
                            model: result.model,
                            promptTokens: result.promptTokens,
                            completionTokens: result.completionTokens,
                            durationMs: Date.now() - startedAt,
                            steps: result.steps,
                        },
                    });
                    return;
                }
                await this.prisma.pageActionRun.update({
                    where: { id: run.id },
                    data: Object.assign({ workflowId: loadResult.workflowId, workflowVersion: loadResult.version, workflowRun: result.workflowRun, status: result.errorCode != null
                            ? client_1.PageActionRunStatus.failed
                            : result.fillText.trim().length > 0
                                ? client_1.PageActionRunStatus.completed
                                : client_1.PageActionRunStatus.failed, fillText: result.fillText || null, dslOutcome: result.dslOutcome, model: result.model, promptTokens: result.promptTokens, completionTokens: result.completionTokens, durationMs: Date.now() - startedAt, finishedAt: new Date(), steps: result.steps }, (result.errorCode
                        ? {
                            errorCode: result.errorCode,
                            errorMessage: (_m = result.errorMessage) !== null && _m !== void 0 ? _m : result.errorCode,
                        }
                        : result.fillText.trim().length === 0
                            ? {
                                errorCode: 'STREAM_EMPTY',
                                errorMessage: 'LLM produced empty fill text',
                            }
                            : {})),
                });
                return;
            }
            (0, page_action_inline_sse_util_1.initInlineSseResponse)(res);
            if (!hostToolResolved) {
                throw new common_1.BadRequestException({
                    code: 'PAGE_ACTION_HOST_TOOL_MISSING',
                    message: 'Legacy PageAction invoke requires hostToolId when no Workflow is bound',
                });
            }
            const result = await (0, page_action_host_fill_executor_1.executePageActionHostFill)(this.llmService, {
                actionRunId: run.id,
                actionKey: pageAction.actionKey,
                generation,
                clientActionId: ((_o = dto.clientActionId) === null || _o === void 0 ? void 0 : _o.trim()) || null,
                systemPrompt: pageAction.systemPrompt,
                messages,
                pageContext,
                hostTool: hostToolResolved,
                res,
                stepRecorder,
            });
            await this.prisma.pageActionRun.update({
                where: { id: run.id },
                data: Object.assign({ status: result.fillText.trim().length > 0
                        ? client_1.PageActionRunStatus.completed
                        : client_1.PageActionRunStatus.failed, fillText: result.fillText || null, dslOutcome: result.dslOutcome, streamId: result.streamId, model: result.model, promptTokens: result.promptTokens, completionTokens: result.completionTokens, durationMs: Date.now() - startedAt, finishedAt: new Date(), steps: result.steps }, (result.fillText.trim().length === 0
                    ? {
                        errorCode: 'STREAM_EMPTY',
                        errorMessage: 'LLM produced empty fill text',
                    }
                    : {})),
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            await this.prisma.pageActionRun.update({
                where: { id: run.id },
                data: {
                    status: client_1.PageActionRunStatus.failed,
                    errorCode: 'LLM_FAILED',
                    errorMessage: message,
                    durationMs: Date.now() - startedAt,
                    finishedAt: new Date(),
                    steps: stepRecorder.toJson(),
                },
            });
            throw error;
        }
    }
    resolvePageContext(dto) {
        var _a, _b, _c, _d, _e, _f, _g;
        return (0, host_bridge_1.coalescePageContext)((0, host_bridge_1.parsePageContextFromMessageFields)({
            pageContext: dto.pageContext,
            page: (_a = dto.pageContext) === null || _a === void 0 ? void 0 : _a.page,
            routePath: (_b = dto.pageContext) === null || _b === void 0 ? void 0 : _b.routePath,
            routeParams: (_c = dto.pageContext) === null || _c === void 0 ? void 0 : _c.routeParams,
            flowId: (_d = dto.pageContext) === null || _d === void 0 ? void 0 : _d.flowId,
            programName: (_e = dto.pageContext) === null || _e === void 0 ? void 0 : _e.programName,
            entity: (_f = dto.pageContext) === null || _f === void 0 ? void 0 : _f.entity,
            metadata: (_g = dto.pageContext) === null || _g === void 0 ? void 0 : _g.metadata,
        }));
    }
    assertInlineStreamOnly(delivery) {
        if (delivery != null && delivery !== client_1.PageActionDelivery.inline_stream) {
            throw new common_1.BadRequestException({
                code: 'DELIVERY_NOT_SUPPORTED',
                message: 'only inline_stream is supported; sync has been removed',
            });
        }
    }
    assertPromptLimits(systemPrompt, instruction, context) {
        if (systemPrompt.length > page_action_constants_1.PAGE_ACTION_PROMPT_LIMITS.systemPromptMax) {
            throw new common_1.BadRequestException({
                code: 'PROMPT_TOO_LARGE',
                message: 'systemPrompt exceeds limit',
            });
        }
        if (instruction &&
            instruction.length > page_action_constants_1.PAGE_ACTION_PROMPT_LIMITS.instructionMax) {
            throw new common_1.BadRequestException({
                code: 'PROMPT_TOO_LARGE',
                message: 'instruction exceeds limit',
            });
        }
        if (context) {
            const serialized = JSON.stringify(context);
            if (serialized.length > page_action_constants_1.PAGE_ACTION_PROMPT_LIMITS.contextJsonMax) {
                throw new common_1.BadRequestException({
                    code: 'PROMPT_TOO_LARGE',
                    message: 'context exceeds limit',
                });
            }
        }
    }
    async findEntityOrThrow(id) {
        const row = await this.prisma.pageAction.findUnique({
            where: { id },
            include: page_action_types_1.PAGE_ACTION_DETAIL_INCLUDE,
        });
        if (!row) {
            throw new common_1.NotFoundException(`PageAction ${id} not found`);
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
    async assertHostToolForApp(appClientId, hostToolId) {
        const row = await this.prisma.hostTool.findFirst({
            where: { id: hostToolId, appClientId },
            include: host_tool_types_1.HOST_TOOL_DETAIL_INCLUDE,
        });
        if (!row) {
            throw new common_1.BadRequestException(`HostTool ${hostToolId} not found for AppClient ${appClientId}`);
        }
    }
};
PageActionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        llm_service_1.LlmService,
        tool_engine_service_1.ToolEngineService,
        workflow_service_1.WorkflowService,
        approval_gate_service_1.ApprovalGateService,
        approval_trigger_permission_service_1.ApprovalTriggerPermissionService])
], PageActionService);
exports.PageActionService = PageActionService;
//# sourceMappingURL=page-action.service.js.map