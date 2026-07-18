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
exports.PageActionCEndService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("../../../../generated/prisma/client");
const page_action_host_tool_util_1 = require("../../../core/page-action/page-action-host-tool.util");
const page_action_host_fill_executor_1 = require("../../../core/page-action/page-action-host-fill.executor");
const page_action_constants_1 = require("../../../core/page-action/page-action.constants");
const page_action_key_util_1 = require("../../../core/page-action/page-action-key.util");
const page_action_invoke_context_util_1 = require("../../../core/page-action/page-action-invoke-context.util");
const page_action_prompt_limits_util_1 = require("../../../core/page-action/page-action-prompt-limits.util");
const page_action_run_lifecycle_util_1 = require("../../../core/page-action/page-action-run-lifecycle.util");
const page_action_run_executor_1 = require("../../../core/page-action/execution/page-action-run.executor");
const page_action_run_stream_hub_1 = require("../../../core/page-action/stream/page-action-run-stream.hub");
const page_action_sse_sink_util_1 = require("../../../core/page-action/stream/page-action-sse-sink.util");
const page_action_inline_sse_util_1 = require("../../../core/page-action/page-action-inline-sse.util");
const page_action_workflow_host_util_1 = require("../../../core/page-action/page-action-workflow-host.util");
const prisma_service_1 = require("../../../prisma/prisma.service");
const page_action_types_1 = require("../page-action.types");
const automation_task_service_1 = require("../../automation/automation-task.service");
let PageActionCEndService = class PageActionCEndService {
    constructor(prisma, runExecutor, runStreamHub, automationTasks) {
        this.prisma = prisma;
        this.runExecutor = runExecutor;
        this.runStreamHub = runStreamHub;
        this.automationTasks = automationTasks;
    }
    async invoke(userId, appClientId, dto) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
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
        const pageContext = (0, page_action_invoke_context_util_1.resolvePageActionInvokePageContext)(dto);
        (0, page_action_host_tool_util_1.assertPageActionScopeMatch)({
            pageScope: pageAction.pageScope,
            hostPageScope: (_b = (_a = hostToolRow === null || hostToolRow === void 0 ? void 0 : hostToolRow.hostPage) === null || _a === void 0 ? void 0 : _a.scope) !== null && _b !== void 0 ? _b : null,
            pageContext,
        });
        const instruction = pageAction.allowCustomInstruction
            ? ((_c = dto.instruction) === null || _c === void 0 ? void 0 : _c.trim()) || null
            : null;
        (0, page_action_prompt_limits_util_1.assertPageActionPromptLimits)({
            systemPrompt: pageAction.systemPrompt,
            instruction,
            context: dto.context,
        });
        const hostToolResolved = hostToolRow
            ? (0, page_action_host_tool_util_1.resolvePageActionHostTool)(hostToolRow, pageContext)
            : null;
        const pageActionKey = (0, page_action_key_util_1.computePageActionKey)({
            actionKey: pageAction.actionKey,
            pageContext,
            instruction,
            context: (_d = dto.context) !== null && _d !== void 0 ? _d : null,
        });
        const activeRun = await this.findActiveRunByPageActionKey({
            pageActionId: pageAction.id,
            userId,
            pageActionKey,
        });
        if (activeRun) {
            this.throwPageActionAlreadyActive(pageActionKey, activeRun);
        }
        if ((_e = dto.idempotencyKey) === null || _e === void 0 ? void 0 : _e.trim()) {
            const prior = await this.prisma.pageActionRun.findFirst({
                where: {
                    appClientId,
                    pageActionId: pageAction.id,
                    idempotencyKey: dto.idempotencyKey.trim(),
                },
                orderBy: { id: 'desc' },
            });
            if (prior) {
                return this.toInvokeAccepted(prior.id, prior.generation, prior.clientActionId, (_f = prior.pageActionKey) !== null && _f !== void 0 ? _f : pageActionKey, prior.status);
            }
        }
        let run;
        try {
            run = await this.prisma.$transaction(async (tx) => {
                var _a, _b;
                const created = await tx.pageActionRun.create({
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
                        pageActionKey,
                        idempotencyKey: ((_a = dto.idempotencyKey) === null || _a === void 0 ? void 0 : _a.trim()) || null,
                        clientActionId: ((_b = dto.clientActionId) === null || _b === void 0 ? void 0 : _b.trim()) || null,
                        steps: [],
                    },
                });
                return tx.pageActionRun.update({
                    where: { id: created.id },
                    data: { generation: created.id },
                });
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                const raced = await this.findActiveRunByPageActionKey({
                    pageActionId: pageAction.id,
                    userId,
                    pageActionKey,
                });
                if (raced) {
                    this.throwPageActionAlreadyActive(pageActionKey, raced);
                }
            }
            throw error;
        }
        this.runStreamHub.prepareSession(run.id);
        this.runExecutor.executeInBackground({
            runId: run.id,
            generation: run.id,
            userId,
            appClientId,
            pageActionId: pageAction.id,
            actionKey: pageAction.actionKey,
            workflowId: pageAction.workflowId,
            workflowVersion: pageAction.workflowVersion,
            flowId: pageAction.flowId,
            flowVersion: pageAction.flowVersion,
            workflowOverrides: pageAction.workflowOverrides,
            systemPrompt: pageAction.systemPrompt,
            instruction,
            context: (_g = dto.context) !== null && _g !== void 0 ? _g : null,
            pageContext,
            pageActionKey,
            clientActionId: ((_h = dto.clientActionId) === null || _h === void 0 ? void 0 : _h.trim()) || null,
            pageActionConfig: pageAction.config,
            hostToolResolved,
        });
        return this.toInvokeAccepted(run.id, run.id, ((_j = dto.clientActionId) === null || _j === void 0 ? void 0 : _j.trim()) || null, pageActionKey, client_1.PageActionRunStatus.running);
    }
    async subscribeRunStream(userId, appClientId, runId, res) {
        var _a, _b, _c;
        const run = await this.prisma.pageActionRun.findFirst({
            where: { id: runId, appClientId, userId },
            include: {
                pageAction: { include: page_action_types_1.PAGE_ACTION_DETAIL_INCLUDE },
            },
        });
        if (!run) {
            throw new common_1.NotFoundException({
                code: 'PAGE_ACTION_RUN_NOT_FOUND',
                message: `PageActionRun ${runId} not found`,
            });
        }
        const canAttachLive = this.runStreamHub.hasActiveSession(runId) ||
            (run.status === client_1.PageActionRunStatus.running &&
                this.runStreamHub.hasSession(runId));
        if (canAttachLive) {
            this.runStreamHub.attachSubscriber(runId, res);
            return;
        }
        if (run.status === client_1.PageActionRunStatus.completed &&
            ((_a = run.fillText) === null || _a === void 0 ? void 0 : _a.trim())) {
            const hostToolRow = await (0, page_action_workflow_host_util_1.resolvePageActionHostToolRow)(this.prisma, run.pageAction);
            const pageContext = ((_b = run.pageContext) !== null && _b !== void 0 ? _b : null);
            const hostToolResolved = hostToolRow
                ? (0, page_action_host_tool_util_1.resolvePageActionHostTool)(hostToolRow, pageContext)
                : null;
            (0, page_action_sse_sink_util_1.initPageActionSseResponse)(res);
            await (0, page_action_host_fill_executor_1.replayPageActionInlineStream)({
                sseSink: (0, page_action_sse_sink_util_1.createExpressPageActionSseSink)(res),
                actionRunId: run.id,
                actionKey: run.pageAction.actionKey,
                generation: run.generation,
                clientActionId: run.clientActionId,
                fillText: run.fillText,
                dslOutcome: run.dslOutcome,
                streamId: run.streamId,
                pageContext,
                hostTool: hostToolResolved,
            });
            return;
        }
        (0, page_action_sse_sink_util_1.initPageActionSseResponse)(res);
        const sink = (0, page_action_sse_sink_util_1.createExpressPageActionSseSink)(res);
        (0, page_action_inline_sse_util_1.writePageActionLifecycle)(sink, {
            phase: (0, page_action_run_lifecycle_util_1.mapPageActionRunStatusToLifecyclePhase)(run.status),
            actionRunId: run.id,
            actionKey: run.pageAction.actionKey,
            delivery: client_1.PageActionDelivery.inline_stream,
            generation: run.generation,
            clientActionId: run.clientActionId,
            text: (_c = run.fillText) !== null && _c !== void 0 ? _c : undefined,
            dslOutcome: run.dslOutcome,
            errorCode: run.errorCode,
            errorMessage: run.errorMessage,
        });
        sink.end();
    }
    listRuns(userId, appClientId, query) {
        return this.automationTasks.list({
            appClientId,
            userId,
            status: query.status,
            triggerSource: 'page_action',
            actionKey: query.actionKey,
            workflowKey: query.workflowKey,
            limit: query.limit,
            offset: query.offset,
        });
    }
    async findActiveRunByPageActionKey(input) {
        return this.prisma.pageActionRun.findFirst({
            where: {
                pageActionId: input.pageActionId,
                userId: input.userId,
                pageActionKey: input.pageActionKey,
                status: { in: [...page_action_key_util_1.PAGE_ACTION_ACTIVE_RUN_STATUSES] },
            },
            include: { approvalRequest: { select: { id: true } } },
            orderBy: { id: 'desc' },
        });
    }
    throwPageActionAlreadyActive(pageActionKey, activeRun) {
        var _a, _b;
        throw new common_1.ConflictException({
            code: 'PAGE_ACTION_ALREADY_ACTIVE',
            message: 'An active PageAction run already exists for the same page context',
            pageActionKey,
            existingRunId: activeRun.id,
            existingStatus: activeRun.status,
            approvalRequestId: (_b = (_a = activeRun.approvalRequest) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null,
            streamUrl: (0, page_action_constants_1.buildPageActionRunStreamPath)(activeRun.id),
        });
    }
    toInvokeAccepted(runId, generation, clientActionId, pageActionKey, status) {
        return {
            runId,
            generation,
            clientActionId: clientActionId !== null && clientActionId !== void 0 ? clientActionId : null,
            pageActionKey,
            streamUrl: (0, page_action_constants_1.buildPageActionRunStreamPath)(runId),
            status,
        };
    }
};
PageActionCEndService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        page_action_run_executor_1.PageActionRunExecutor,
        page_action_run_stream_hub_1.PageActionRunStreamHub,
        automation_task_service_1.AutomationTaskService])
], PageActionCEndService);
exports.PageActionCEndService = PageActionCEndService;
//# sourceMappingURL=page-action-c-end.service.js.map