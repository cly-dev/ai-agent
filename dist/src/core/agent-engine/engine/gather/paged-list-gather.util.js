"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expandPagedListGather = exports.resumeIncompletePagedGather = exports.shouldRouteGraphToTools = exports.resolvePagedGatherResumeRoute = exports.resolvePagedGatherResumeKind = exports.shouldResumePagedGather = exports.findIncompletePagedGatherTarget = void 0;
const pagination_1 = require("../../../mcp-utils/pagination");
const plan_paged_gather_util_1 = require("./plan-paged-gather.util");
const tool_pagination_params_util_1 = require("../../../tool-engine/tool-pagination-params.util");
const observation_format_util_1 = require("../observation-format.util");
const list_map_reduce_util_1 = require("./list-map-reduce.util");
const list_page_summary_util_1 = require("./list-page-summary.util");
const message_blocks_util_1 = require("../message/message-blocks.util");
function isRecord(value) {
    return value != null && typeof value === 'object' && !Array.isArray(value);
}
function listToolStepsFromRound(round) {
    const needed = round.lastToolRoundMeta.toolCalls.length;
    if (needed === 0) {
        return [];
    }
    const toolSteps = [];
    for (let i = round.steps.length - 1; i >= 0 && toolSteps.length < needed; i -= 1) {
        const step = round.steps[i];
        if ((step === null || step === void 0 ? void 0 : step.type) === 'tool') {
            toolSteps.unshift(step);
        }
    }
    return toolSteps;
}
function resolveExecutedToolArgs(round, toolCall, toolCallIndex) {
    const toolSteps = listToolStepsFromRound(round);
    const step = toolSteps[toolCallIndex];
    if (step && isRecord(step.input)) {
        return step.input;
    }
    return toolCall.arguments;
}
function resolveExecutedArgsFromObservation(observation, toolName, steps) {
    var _a;
    for (let i = steps.length - 1; i >= 0; i -= 1) {
        const step = steps[i];
        if ((step === null || step === void 0 ? void 0 : step.type) === 'tool' &&
            step.name === toolName &&
            isRecord(step.input)) {
            return step.input;
        }
    }
    const payloadArgs = (_a = observation.llmPayload) === null || _a === void 0 ? void 0 : _a.args;
    if (isRecord(payloadArgs)) {
        return payloadArgs;
    }
    return {};
}
function remapObservationIndicesAfterConsolidation(indices, primaryIndex, pagesFetched) {
    const removedCount = Math.max(0, pagesFetched - 1);
    return indices.map((idx) => {
        if (idx >= primaryIndex + pagesFetched) {
            return idx - removedCount;
        }
        return idx;
    });
}
function readPageRowFingerprint(output) {
    const rows = (0, message_blocks_util_1.extractListRowsFromToolOutput)(output);
    const first = rows[0];
    if (!first) {
        return null;
    }
    if (first.id != null) {
        return `id:${String(first.id)}`;
    }
    return JSON.stringify(first).slice(0, 120);
}
function findIncompletePagedGatherTarget(input) {
    for (let index = 0; index < input.observations.length; index += 1) {
        const observation = input.observations[index];
        if (!(0, list_map_reduce_util_1.isMapReducePagedGatherResumable)(observation.output)) {
            continue;
        }
        if (!(0, plan_paged_gather_util_1.isReadListGatherToolStep)({
            toolName: observation.name,
            scopedTools: input.scopedTools,
            taskPlan: input.taskPlan,
        })) {
            continue;
        }
        return { observationIndex: index, toolName: observation.name };
    }
    return null;
}
exports.findIncompletePagedGatherTarget = findIncompletePagedGatherTarget;
function shouldResumePagedGather(input) {
    return findIncompletePagedGatherTarget(input) != null;
}
exports.shouldResumePagedGather = shouldResumePagedGather;
function resolvePagedGatherResumeKind(input) {
    const target = findIncompletePagedGatherTarget(input);
    if (!target) {
        return null;
    }
    const observation = input.observations[target.observationIndex];
    const state = (0, list_map_reduce_util_1.readMapReduceFromObservation)(observation.output);
    if (!state) {
        return null;
    }
    if ((0, list_map_reduce_util_1.needsMapSummaryResume)(state)) {
        return 'map_summary';
    }
    if ((0, list_map_reduce_util_1.needsPaginationResume)(state)) {
        return 'pagination';
    }
    return null;
}
exports.resolvePagedGatherResumeKind = resolvePagedGatherResumeKind;
function resolvePagedGatherResumeRoute(input) {
    const gatherCtx = {
        taskPlan: input.taskPlan,
        scopedTools: input.scopedTools,
        observations: input.observations,
    };
    if (!shouldResumePagedGather(gatherCtx)) {
        return null;
    }
    if (input.pendingToolCalls.length > 0) {
        if (!(0, plan_paged_gather_util_1.planAwaitingPagedGatherCompletion)(input.taskPlan)) {
            return null;
        }
        return { supersededPendingToolCallCount: input.pendingToolCalls.length };
    }
    return { supersededPendingToolCallCount: 0 };
}
exports.resolvePagedGatherResumeRoute = resolvePagedGatherResumeRoute;
function shouldRouteGraphToTools(input) {
    if (input.pendingToolCalls.length > 0) {
        return true;
    }
    return shouldResumePagedGather(input);
}
exports.shouldRouteGraphToTools = shouldRouteGraphToTools;
function schedulePageSummaryFromRows(input) {
    const summaryInput = {
        llmService: input.gatherLlm.llmService,
        promptRegistry: input.gatherLlm.promptRegistry,
        scope: input.gatherLlm.scope,
        currentObjective: input.gatherLlm.currentObjective,
        runMetrics: input.gatherLlm.runMetrics,
        runId: input.gatherLlm.runId,
        sessionId: input.gatherLlm.sessionId,
        iteration: input.gatherLlm.iteration,
        toolName: input.toolName,
        onDebugLog: input.gatherLlm.onDebugLog,
        page: input.pageMeta.page,
        rows: input.rows,
        fieldLabels: input.fieldLabels,
        fieldDescriptions: input.fieldDescriptions,
        enumLabelsByPath: input.enumLabelsByPath,
    };
    input.pipeline.schedule(Object.assign(Object.assign({}, summaryInput), { onScheduled: (page) => {
            var _a, _b;
            const label = (_a = input.progressLabel) !== null && _a !== void 0 ? _a : '拉取';
            (_b = input.onProgress) === null || _b === void 0 ? void 0 : _b.call(input, `第 ${page} 页已${label}（${input.rows.length} 条），正在异步生成页内摘要…\n`);
        } }));
}
function schedulePageSummaryOnly(input) {
    const rows = (0, message_blocks_util_1.extractListRowsFromToolOutput)(input.output);
    schedulePageSummaryFromRows({
        pageMeta: input.pageMeta,
        rows,
        fieldLabels: input.fieldLabels,
        fieldDescriptions: input.fieldDescriptions,
        enumLabelsByPath: input.enumLabelsByPath,
        pipeline: input.pipeline,
        gatherLlm: input.gatherLlm,
        toolName: input.toolName,
        onProgress: input.onProgress,
        progressLabel: input.progressLabel,
    });
}
function schedulePageSummaryForOutput(input) {
    var _a;
    const rows = (0, message_blocks_util_1.extractListRowsFromToolOutput)(input.output);
    let mapState = (0, list_map_reduce_util_1.recordPageFetch)({
        state: input.mapState,
        output: input.output,
        total: (_a = input.total) !== null && _a !== void 0 ? _a : input.pageMeta.total,
        apiPage: input.pageMeta.page,
        pageSize: input.pageMeta.pageSize,
    });
    mapState = (0, list_map_reduce_util_1.recordPageSourceCache)({
        state: mapState,
        page: input.pageMeta.page,
        rows,
    });
    schedulePageSummaryOnly({
        pageMeta: input.pageMeta,
        output: input.output,
        fieldLabels: input.fieldLabels,
        fieldDescriptions: input.fieldDescriptions,
        enumLabelsByPath: input.enumLabelsByPath,
        pipeline: input.pipeline,
        gatherLlm: input.gatherLlm,
        toolName: input.toolName,
        onProgress: input.onProgress,
    });
    return mapState;
}
function isHttpBudgetExhausted(budget) {
    return budget != null && budget.used >= budget.max;
}
function consumeHttpBudget(budget) {
    if (budget) {
        budget.used += 1;
    }
}
async function runPaginationLoop(input) {
    var _a, _b, _c, _d, _e, _f, _g;
    const pagesFetchedAtStart = input.pagesFetched;
    let cursor = input.initialCursor;
    let steps = [...input.steps];
    let observations = [...input.observations];
    let mapState = input.mapState;
    const maxPages = (0, pagination_1.resolveGatherMaxPages)(mapState.pageSize || input.initialLastPageMeta.pageSize);
    let pagesFetched = input.pagesFetched;
    let lastPageMeta = input.initialLastPageMeta;
    let hitMaxPages = false;
    let hitHttpBudget = false;
    let hitMaxRows = false;
    let lastPageFingerprint = (_a = mapState.lastPageFingerprint) !== null && _a !== void 0 ? _a : readPageRowFingerprint((_b = observations[input.primaryObservationIndex]) === null || _b === void 0 ? void 0 : _b.output);
    let previousPageFingerprint = lastPageFingerprint;
    while (pagesFetched < maxPages &&
        (0, pagination_1.shouldFetchAnotherPage)(lastPageMeta) &&
        !isHttpBudgetExhausted(input.httpBudget) &&
        !(0, list_map_reduce_util_1.hasReachedMaxListRows)(mapState)) {
        const nextArgs = (0, pagination_1.buildNextPageToolArgs)(input.executedArgs, cursor);
        const nextCall = {
            name: input.toolName,
            arguments: nextArgs,
        };
        (_c = input.onProgress) === null || _c === void 0 ? void 0 : _c.call(input, `正在拉取第 ${cursor.nextPage} 页…\n`);
        const pageRound = await input.runRound([nextCall], observations, steps);
        consumeHttpBudget(input.httpBudget);
        steps = pageRound.steps;
        observations = pageRound.toolObservations;
        const pageObservationIndex = pageRound.lastToolRoundMeta.roundObservationIndices[0];
        const pageObservation = observations[pageObservationIndex];
        if (!pageObservation) {
            break;
        }
        const pageExecutedArgs = resolveExecutedToolArgs(pageRound, nextCall, 0);
        const pageMeta = (0, pagination_1.extractListPaginationMeta)({
            output: pageObservation.output,
            args: pageExecutedArgs,
            llmPayload: pageObservation.llmPayload,
        });
        if (!pageMeta || pageMeta.rowCount === 0) {
            break;
        }
        const pageFingerprint = readPageRowFingerprint(pageObservation.output);
        if (pageFingerprint != null &&
            previousPageFingerprint != null &&
            pageFingerprint === previousPageFingerprint) {
            (_d = input.onProgress) === null || _d === void 0 ? void 0 : _d.call(input, '检测到分页结果重复，停止继续拉取。\n');
            break;
        }
        previousPageFingerprint = pageFingerprint;
        lastPageFingerprint = pageFingerprint;
        mapState = schedulePageSummaryForOutput({
            mapState,
            output: pageObservation.output,
            pageMeta,
            total: (_f = (_e = pageMeta.total) !== null && _e !== void 0 ? _e : input.firstTotal) !== null && _f !== void 0 ? _f : mapState.total,
            fieldLabels: input.fieldLabels,
            fieldDescriptions: input.fieldDescriptions,
            enumLabelsByPath: input.enumLabelsByPath,
            pipeline: input.pipeline,
            gatherLlm: input.gatherLlm,
            toolName: input.toolName,
            onProgress: input.onProgress,
        });
        pagesFetched += 1;
        lastPageMeta = pageMeta;
        if ((0, list_map_reduce_util_1.hasReachedMaxListRows)(mapState)) {
            hitMaxRows = true;
            if (mapState.total != null && mapState.fetchedCount < mapState.total) {
                (_g = input.onProgress) === null || _g === void 0 ? void 0 : _g.call(input, `已达单次分析上限 ${mapState.maxRows} 条（共 ${mapState.total} 条），将基于已拉取样本继续摘要…\n`);
            }
            break;
        }
        if (!(0, pagination_1.shouldFetchAnotherPage)(pageMeta)) {
            break;
        }
        if (pagesFetched >= maxPages) {
            hitMaxPages = true;
            break;
        }
        cursor = (0, pagination_1.resolvePaginationCursor)(pageExecutedArgs, pageMeta);
    }
    if (pagesFetched >= maxPages && (0, pagination_1.shouldFetchAnotherPage)(lastPageMeta)) {
        hitMaxPages = true;
    }
    if (isHttpBudgetExhausted(input.httpBudget) && (0, pagination_1.shouldFetchAnotherPage)(lastPageMeta)) {
        hitHttpBudget = true;
    }
    if ((0, list_map_reduce_util_1.hasReachedMaxListRows)(mapState) &&
        mapState.total != null &&
        mapState.fetchedCount < mapState.total) {
        hitMaxRows = true;
    }
    return {
        steps,
        observations,
        mapState,
        pagesFetched,
        pagesAdded: pagesFetched - pagesFetchedAtStart,
        lastPageMeta,
        lastPageFingerprint,
        hitMaxPages,
        hitHttpBudget,
        hitMaxRows,
    };
}
function resolveLatestStepIteration(steps) {
    var _a, _b;
    if (steps.length === 0) {
        return 0;
    }
    return (_b = (_a = steps[steps.length - 1]) === null || _a === void 0 ? void 0 : _a.step) !== null && _b !== void 0 ? _b : 0;
}
function upsertGatherMapRunStep(steps, iteration, toolName, mapState) {
    const gatherStep = {
        step: iteration,
        type: 'gather',
        name: toolName,
        output: {
            complete: mapState.complete,
            mapComplete: mapState.mapComplete,
            fetchedCount: mapState.fetchedCount,
            total: mapState.total,
            pageCount: mapState.pageCount,
            fetchedApiPages: mapState.fetchedApiPages,
            pageSummaries: mapState.pageSummaries,
            truncated: mapState.truncated === true,
            truncatedByMaxRows: mapState.truncatedByMaxRows === true,
            mapPartial: mapState.mapPartial === true,
            mapResumeStalled: mapState.mapResumeStalled === true,
            resumeStalled: mapState.resumeStalled === true,
            httpBudgetExhausted: mapState.httpBudgetExhausted === true,
        },
    };
    const without = steps.filter((step) => step.type !== 'gather' || step.name !== toolName);
    return [...without, gatherStep];
}
function finalizePagedGatherRound(input) {
    var _a;
    input.mapState.lastPageFingerprint = input.lastPageFingerprint;
    const fetchStatus = (0, list_map_reduce_util_1.resolveMapReduceFetchComplete)({
        state: input.mapState,
        lastPageMeta: input.lastPageMeta,
        hitMaxPages: input.hitMaxPages || input.hitHttpBudget,
        hitHttpBudget: input.hitHttpBudget,
        hitMaxRows: input.hitMaxRows,
    });
    input.mapState.complete = fetchStatus.complete;
    input.mapState.truncated = fetchStatus.truncated;
    if (input.hitMaxRows) {
        input.mapState.truncatedByMaxRows = true;
    }
    if (input.hitHttpBudget) {
        input.mapState.httpBudgetExhausted = true;
    }
    if (input.pagesAdded === 0 && input.mapState.fetchedCount > 0) {
        if (!fetchStatus.complete) {
            input.mapState.resumeStalled = true;
        }
        else if (!input.mapState.mapComplete && !input.hitMaxRows) {
            input.mapState.mapResumeStalled = true;
        }
    }
    const stateForObservation = input.mapState.mapComplete === true
        ? Object.assign(Object.assign({}, input.mapState), { pageSourceByApiPage: undefined }) : input.mapState;
    const consolidatedOutput = (0, list_map_reduce_util_1.buildMapReduceObservationOutput)(stateForObservation);
    const steps = upsertGatherMapRunStep(input.steps, resolveLatestStepIteration(input.steps), input.toolName, input.mapState);
    const primaryObservation = input.observations[input.primaryObservationIndex];
    const consolidatedObservation = Object.assign(Object.assign({}, primaryObservation), { output: consolidatedOutput, llmPayload: (0, observation_format_util_1.formatObservationForLlm)({
            toolName: input.toolName,
            output: consolidatedOutput,
            fieldLabels: primaryObservation.fieldLabels,
            args: input.executedArgs,
        }), quality: fetchStatus.complete && input.mapState.mapComplete ? 'high' : 'medium' });
    const observations = [
        ...input.observations.slice(0, input.primaryObservationIndex),
        consolidatedObservation,
        ...input.observations.slice(input.primaryObservationIndex + input.pagesFetched),
    ];
    const capNote = input.mapState.truncatedByMaxRows === true && input.mapState.total != null
        ? `（已达分析上限 ${input.mapState.maxRows} 条，全量共 ${input.mapState.total} 条）`
        : '';
    (_a = input.onProgress) === null || _a === void 0 ? void 0 : _a.call(input, fetchStatus.complete && input.mapState.mapComplete
        ? `分页与页内摘要完成：共 ${input.mapState.fetchedCount} 条（${input.mapState.pageCount} 页）${capNote}\n`
        : `分页或摘要未完整结束：已获取 ${input.mapState.fetchedCount}${input.mapState.total != null ? `/${input.mapState.total}` : ''} 条（${input.mapState.pageCount} 页）${capNote}\n`);
    return {
        steps,
        toolObservations: observations,
        lastToolRoundMeta: {
            toolCalls: input.round.lastToolRoundMeta.toolCalls,
            executionStatuses: [...input.round.lastToolRoundMeta.executionStatuses],
            errorDispositions: [...input.round.lastToolRoundMeta.errorDispositions],
            roundObservationIndices: remapObservationIndicesAfterConsolidation(input.round.lastToolRoundMeta.roundObservationIndices, input.primaryObservationIndex, input.pagesFetched),
        },
    };
}
async function expandSingleReadListCall(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    const { toolCall, toolCallIndex, observationIndex, round, runRound, onProgress, } = input;
    const observation = round.toolObservations[observationIndex];
    if (!observation) {
        return round;
    }
    const executedArgs = resolveExecutedToolArgs(round, toolCall, toolCallIndex);
    const firstMeta = (0, pagination_1.extractListPaginationMeta)({
        output: observation.output,
        args: executedArgs,
        llmPayload: observation.llmPayload,
    });
    if (!firstMeta || firstMeta.rowCount === 0) {
        return round;
    }
    const fieldLabels = (_a = observation.fieldLabels) !== null && _a !== void 0 ? _a : {};
    const fieldDescriptions = (_b = observation.fieldDescriptions) !== null && _b !== void 0 ? _b : {};
    const enumLabelsByPath = (_c = observation.enumLabelsByPath) !== null && _c !== void 0 ? _c : {};
    const pipeline = new list_page_summary_util_1.ListPageSummaryPipeline();
    const pageContext = {
        fieldLabels,
        fieldDescriptions,
        enumLabelsByPath,
        gatherLlm: input.gatherLlm,
        pipeline,
    };
    let mapState = (0, list_map_reduce_util_1.createEmptyMapReduceState)(firstMeta.pageSize);
    mapState = schedulePageSummaryForOutput({
        mapState,
        output: observation.output,
        pageMeta: firstMeta,
        total: firstMeta.total,
        fieldLabels,
        fieldDescriptions,
        enumLabelsByPath,
        pipeline,
        gatherLlm: input.gatherLlm,
        toolName: toolCall.name,
        onProgress,
    });
    mapState.lastPageFingerprint = readPageRowFingerprint(observation.output);
    let pagesFetched = 1;
    let hitMaxRows = (0, list_map_reduce_util_1.hasReachedMaxListRows)(mapState);
    let loopResult = null;
    if (!firstMeta.hasMore || hitMaxRows) {
        onProgress === null || onProgress === void 0 ? void 0 : onProgress(`数据共 ${(_d = firstMeta.total) !== null && _d !== void 0 ? _d : firstMeta.rowCount} 条（${pagesFetched} 页），等待页内摘要完成…\n`);
    }
    else {
        const estimatedPages = firstMeta.total != null
            ? Math.ceil(Math.min(firstMeta.total, mapState.maxRows) / firstMeta.pageSize)
            : null;
        onProgress === null || onProgress === void 0 ? void 0 : onProgress(`数据共 ${(_e = firstMeta.total) !== null && _e !== void 0 ? _e : '未知'} 条，正在分页拉取（第 1${estimatedPages != null ? `/${estimatedPages}` : ''} 页）…\n`);
        loopResult = await runPaginationLoop(Object.assign({ toolName: toolCall.name, executedArgs,
            mapState,
            pagesFetched, primaryObservationIndex: observationIndex, observations: [...round.toolObservations], steps: [...round.steps], firstTotal: firstMeta.total, initialLastPageMeta: firstMeta, initialCursor: (0, pagination_1.resolvePaginationCursor)(executedArgs, firstMeta), runRound, httpBudget: input.httpBudget, onProgress }, pageContext));
        mapState = loopResult.mapState;
        pagesFetched = loopResult.pagesFetched;
        hitMaxRows = loopResult.hitMaxRows;
    }
    onProgress === null || onProgress === void 0 ? void 0 : onProgress('正在等待各页摘要完成…\n');
    const pageSummaries = await pipeline.awaitAll();
    mapState = (0, list_map_reduce_util_1.applyPageSummariesToState)(mapState, pageSummaries);
    const lastPageMeta = (_f = loopResult === null || loopResult === void 0 ? void 0 : loopResult.lastPageMeta) !== null && _f !== void 0 ? _f : firstMeta;
    const lastPageFingerprint = (_h = (_g = loopResult === null || loopResult === void 0 ? void 0 : loopResult.lastPageFingerprint) !== null && _g !== void 0 ? _g : mapState.lastPageFingerprint) !== null && _h !== void 0 ? _h : null;
    return finalizePagedGatherRound({
        round,
        primaryObservationIndex: observationIndex,
        pagesFetched,
        pagesAdded: (_j = loopResult === null || loopResult === void 0 ? void 0 : loopResult.pagesAdded) !== null && _j !== void 0 ? _j : 0,
        mapState,
        lastPageMeta,
        lastPageFingerprint,
        hitMaxPages: (_k = loopResult === null || loopResult === void 0 ? void 0 : loopResult.hitMaxPages) !== null && _k !== void 0 ? _k : false,
        hitHttpBudget: (_l = loopResult === null || loopResult === void 0 ? void 0 : loopResult.hitHttpBudget) !== null && _l !== void 0 ? _l : false,
        hitMaxRows,
        observations: (_m = loopResult === null || loopResult === void 0 ? void 0 : loopResult.observations) !== null && _m !== void 0 ? _m : [...round.toolObservations],
        steps: (_o = loopResult === null || loopResult === void 0 ? void 0 : loopResult.steps) !== null && _o !== void 0 ? _o : [...round.steps],
        executedArgs,
        toolName: toolCall.name,
        onProgress,
    });
}
function buildResumeLastPageMeta(executedArgs, existing) {
    var _a, _b, _c;
    const pageParam = (_a = Object.keys(executedArgs).find((key) => (0, tool_pagination_params_util_1.classifyPaginationParam)(key) === 'page')) !== null && _a !== void 0 ? _a : 'page';
    const sizeParam = (_b = Object.keys(executedArgs).find((key) => (0, tool_pagination_params_util_1.classifyPaginationParam)(key) === 'size')) !== null && _b !== void 0 ? _b : 'size';
    return {
        page: (_c = existing.lastApiPage) !== null && _c !== void 0 ? _c : existing.pageCount,
        pageSize: existing.pageSize,
        rowCount: Math.max(1, existing.pageSize),
        total: existing.total,
        hasMore: existing.total != null
            ? existing.fetchedCount < existing.total
            : true,
        pageParam,
        sizeParam,
    };
}
async function resumeMapSummariesOnly(input) {
    var _a, _b, _c, _d, _e;
    const pageParam = (_a = Object.keys(input.executedArgs).find((key) => (0, tool_pagination_params_util_1.classifyPaginationParam)(key) === 'page')) !== null && _a !== void 0 ? _a : 'page';
    const sizeParam = (_b = Object.keys(input.executedArgs).find((key) => (0, tool_pagination_params_util_1.classifyPaginationParam)(key) === 'size')) !== null && _b !== void 0 ? _b : 'size';
    let observations = [...input.observations];
    let steps = [...input.steps];
    for (const page of input.pages) {
        const cached = (0, list_map_reduce_util_1.findPageSourceCache)(input.mapState, page);
        if (cached) {
            (_c = input.onProgress) === null || _c === void 0 ? void 0 : _c.call(input, `正在重试第 ${page} 页页内摘要（复用已拉取数据）…\n`);
            schedulePageSummaryFromRows({
                pageMeta: {
                    page,
                    pageSize: input.mapState.pageSize,
                    rowCount: cached.rowCount,
                    total: input.mapState.total,
                    hasMore: false,
                    pageParam,
                    sizeParam,
                },
                rows: cached.rows,
                fieldLabels: input.pageContext.fieldLabels,
                fieldDescriptions: input.pageContext.fieldDescriptions,
                enumLabelsByPath: input.pageContext.enumLabelsByPath,
                pipeline: input.pageContext.pipeline,
                gatherLlm: input.pageContext.gatherLlm,
                toolName: input.toolName,
                onProgress: input.onProgress,
                progressLabel: '缓存',
            });
            continue;
        }
        if (isHttpBudgetExhausted(input.httpBudget)) {
            (_d = input.onProgress) === null || _d === void 0 ? void 0 : _d.call(input, 'HTTP 预算已用尽，停止页内摘要补跑。\n');
            break;
        }
        const pageArgs = Object.assign(Object.assign({}, input.executedArgs), { [pageParam]: page, [sizeParam]: input.mapState.pageSize });
        const nextCall = {
            name: input.toolName,
            arguments: pageArgs,
        };
        (_e = input.onProgress) === null || _e === void 0 ? void 0 : _e.call(input, `第 ${page} 页无缓存，正在补拉以重试页内摘要…\n`);
        const pageRound = await input.runRound([nextCall], observations, steps);
        consumeHttpBudget(input.httpBudget);
        steps = pageRound.steps;
        observations = pageRound.toolObservations;
        const pageObservationIndex = pageRound.lastToolRoundMeta.roundObservationIndices[0];
        const pageObservation = observations[pageObservationIndex];
        if (!pageObservation) {
            continue;
        }
        const pageExecutedArgs = resolveExecutedToolArgs(pageRound, nextCall, 0);
        const pageMeta = (0, pagination_1.extractListPaginationMeta)({
            output: pageObservation.output,
            args: pageExecutedArgs,
            llmPayload: pageObservation.llmPayload,
        });
        if (!pageMeta || pageMeta.rowCount === 0) {
            continue;
        }
        schedulePageSummaryOnly({
            pageMeta,
            output: pageObservation.output,
            fieldLabels: input.pageContext.fieldLabels,
            fieldDescriptions: input.pageContext.fieldDescriptions,
            enumLabelsByPath: input.pageContext.enumLabelsByPath,
            pipeline: input.pageContext.pipeline,
            gatherLlm: input.pageContext.gatherLlm,
            toolName: input.toolName,
            onProgress: input.onProgress,
            progressLabel: '补拉',
        });
    }
    const summaries = await input.pageContext.pipeline.awaitAll();
    return { observations, steps, summaries };
}
async function resumeIncompletePagedGather(input) {
    var _a, _b, _c, _d, _e, _f, _g;
    const target = findIncompletePagedGatherTarget(input);
    if (!target) {
        return null;
    }
    const observation = input.observations[target.observationIndex];
    const existing = (0, list_map_reduce_util_1.readMapReduceFromObservation)(observation.output);
    if (!existing) {
        return null;
    }
    const executedArgs = resolveExecutedArgsFromObservation(observation, target.toolName, input.steps);
    const fieldLabels = (_a = observation.fieldLabels) !== null && _a !== void 0 ? _a : {};
    const fieldDescriptions = (_b = observation.fieldDescriptions) !== null && _b !== void 0 ? _b : {};
    const enumLabelsByPath = (_c = observation.enumLabelsByPath) !== null && _c !== void 0 ? _c : {};
    const pipeline = new list_page_summary_util_1.ListPageSummaryPipeline();
    const pageContext = {
        fieldLabels,
        fieldDescriptions,
        enumLabelsByPath,
        gatherLlm: input.gatherLlm,
        pipeline,
    };
    const resumeLastPageMeta = buildResumeLastPageMeta(executedArgs, existing);
    const syntheticRound = {
        steps: input.steps,
        toolObservations: input.observations,
        lastToolRoundMeta: {
            toolCalls: [{ name: target.toolName, arguments: executedArgs }],
            executionStatuses: ['SUCCESS'],
            errorDispositions: ['llm'],
            roundObservationIndices: [target.observationIndex],
        },
    };
    if ((0, list_map_reduce_util_1.needsMapSummaryResume)(existing)) {
        const pagesToRetry = (0, list_map_reduce_util_1.resolvePagesNeedingSummary)(existing);
        (_d = input.onProgress) === null || _d === void 0 ? void 0 : _d.call(input, `分页已完成，正在补跑 ${pagesToRetry.length} 个页的页内摘要…\n`);
        const retryResult = await resumeMapSummariesOnly({
            toolName: target.toolName,
            executedArgs,
            pages: pagesToRetry,
            mapState: existing,
            observations: [...input.observations],
            steps: [...input.steps],
            runRound: input.runRound,
            httpBudget: input.httpBudget,
            pageContext,
            onProgress: input.onProgress,
        });
        let mapState = (0, list_map_reduce_util_1.applyPageSummariesToState)(existing, (0, list_map_reduce_util_1.mergePageSummaryResults)(existing.pageSummaries, retryResult.summaries));
        mapState = Object.assign(Object.assign({}, mapState), { mapResumeStalled: !mapState.mapComplete && pagesToRetry.length > 0 ? true : false });
        return finalizePagedGatherRound({
            round: syntheticRound,
            primaryObservationIndex: target.observationIndex,
            pagesFetched: existing.pageCount,
            pagesAdded: 0,
            mapState,
            lastPageMeta: resumeLastPageMeta,
            lastPageFingerprint: (_e = existing.lastPageFingerprint) !== null && _e !== void 0 ? _e : null,
            hitMaxPages: false,
            hitHttpBudget: isHttpBudgetExhausted(input.httpBudget),
            hitMaxRows: existing.truncatedByMaxRows === true,
            observations: retryResult.observations,
            steps: retryResult.steps,
            executedArgs,
            toolName: target.toolName,
            onProgress: input.onProgress,
        });
    }
    if (!(0, list_map_reduce_util_1.needsPaginationResume)(existing) ||
        (0, list_map_reduce_util_1.hasReachedMaxListRows)(existing)) {
        return null;
    }
    (_f = input.onProgress) === null || _f === void 0 ? void 0 : _f.call(input, `继续分页拉取：已获取 ${existing.fetchedCount}${existing.total != null ? `/${existing.total}` : ''} 条…\n`);
    const loopResult = await runPaginationLoop(Object.assign({ toolName: target.toolName, executedArgs, mapState: existing, pagesFetched: existing.pageCount, primaryObservationIndex: target.observationIndex, observations: [...input.observations], steps: [...input.steps], firstTotal: existing.total, initialLastPageMeta: resumeLastPageMeta, initialCursor: (0, pagination_1.resolvePaginationCursor)(executedArgs, resumeLastPageMeta), runRound: input.runRound, httpBudget: input.httpBudget, onProgress: input.onProgress }, pageContext));
    (_g = input.onProgress) === null || _g === void 0 ? void 0 : _g.call(input, '正在等待各页摘要完成…\n');
    const newPageSummaries = await pipeline.awaitAll();
    const mapState = (0, list_map_reduce_util_1.applyPageSummariesToState)(loopResult.mapState, (0, list_map_reduce_util_1.mergePageSummaryResults)(existing.pageSummaries, newPageSummaries));
    return finalizePagedGatherRound({
        round: syntheticRound,
        primaryObservationIndex: target.observationIndex,
        pagesFetched: loopResult.pagesFetched,
        pagesAdded: loopResult.pagesAdded,
        mapState,
        lastPageMeta: loopResult.lastPageMeta,
        lastPageFingerprint: loopResult.lastPageFingerprint,
        hitMaxPages: loopResult.hitMaxPages,
        hitHttpBudget: loopResult.hitHttpBudget,
        hitMaxRows: loopResult.hitMaxRows,
        observations: loopResult.observations,
        steps: loopResult.steps,
        executedArgs,
        toolName: target.toolName,
        onProgress: input.onProgress,
    });
}
exports.resumeIncompletePagedGather = resumeIncompletePagedGather;
async function expandPagedListGather(input) {
    const { round, taskPlan, scopedTools, runRound, gatherLlm, httpBudget, onProgress } = input;
    if (round.lastToolRoundMeta.toolCalls.length === 0) {
        return round;
    }
    let result = round;
    for (let index = 0; index < result.lastToolRoundMeta.toolCalls.length; index += 1) {
        const toolCall = result.lastToolRoundMeta.toolCalls[index];
        const observationIndex = result.lastToolRoundMeta.roundObservationIndices[index];
        if (observationIndex == null) {
            continue;
        }
        const status = result.lastToolRoundMeta.executionStatuses[index];
        if (status === 'ERROR' || status === 'EMPTY') {
            continue;
        }
        const observation = result.toolObservations[observationIndex];
        const executedArgs = resolveExecutedToolArgs(result, toolCall, index);
        if (!(0, plan_paged_gather_util_1.shouldExpandPlanPagedGather)({
            taskPlan,
            toolName: toolCall.name,
            scopedTools,
            output: observation === null || observation === void 0 ? void 0 : observation.output,
            args: executedArgs,
            llmPayload: observation === null || observation === void 0 ? void 0 : observation.llmPayload,
        })) {
            continue;
        }
        result = await expandSingleReadListCall({
            toolCall,
            toolCallIndex: index,
            observationIndex,
            round: result,
            runRound,
            gatherLlm,
            httpBudget,
            onProgress,
        });
    }
    return result;
}
exports.expandPagedListGather = expandPagedListGather;
//# sourceMappingURL=paged-list-gather.util.js.map