"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toAgentListResponseList = exports.toAgentWithToolsResponseList = exports.toAgentToolsBindingResponse = exports.toAgentToolBindingItemList = exports.toAgentToolBindingItem = exports.toAgentListResponse = exports.toAgentWithToolsResponse = exports.toAgentLinkedToolResponse = void 0;
const host_tool_mapper_1 = require("../../host-tool/host-tool.mapper");
function mapAgentToolBindings(agentTools) {
    const tools = agentTools.map(({ tool }) => toAgentLinkedToolResponse(tool));
    const bindings = agentTools.map(({ id, agentId, toolId, tool }) => ({
        id,
        agentId,
        toolId,
        tool: toAgentLinkedToolResponse(tool),
    }));
    return { tools, agentTools: bindings };
}
function mapAgentCoreFields(row) {
    return row;
}
function toAgentLinkedToolResponse(tool) {
    var _a, _b;
    const tags = [];
    const categoryLabel = (_b = (_a = tool.toolCategory) === null || _a === void 0 ? void 0 : _a.label) === null || _b === void 0 ? void 0 : _b.trim();
    if (categoryLabel) {
        tags.push(categoryLabel);
    }
    return Object.assign(Object.assign({}, tool), { tags });
}
exports.toAgentLinkedToolResponse = toAgentLinkedToolResponse;
function toAgentWithToolsResponse(row) {
    const { agentTools, agentHostTools } = row, agent = __rest(row, ["agentTools", "agentHostTools"]);
    const { tools, agentTools: mappedAgentTools } = mapAgentToolBindings(agentTools);
    const mappedAgentHostTools = agentHostTools.map((binding) => (0, host_tool_mapper_1.toAgentHostToolBindingResponse)(binding));
    return Object.assign(Object.assign({}, mapAgentCoreFields(agent)), { tools, agentTools: mappedAgentTools, hostTools: mappedAgentHostTools.map((binding) => binding.hostTool), agentHostTools: mappedAgentHostTools, hostToolCount: mappedAgentHostTools.length });
}
exports.toAgentWithToolsResponse = toAgentWithToolsResponse;
function toAgentListResponse(row) {
    var _a;
    const { agentTools, _count } = row, agent = __rest(row, ["agentTools", "_count"]);
    const { tools, agentTools: mappedAgentTools } = mapAgentToolBindings(agentTools);
    return Object.assign(Object.assign({}, mapAgentCoreFields(agent)), { tools, agentTools: mappedAgentTools, hostTools: [], agentHostTools: [], hostToolCount: (_a = _count === null || _count === void 0 ? void 0 : _count.agentHostTools) !== null && _a !== void 0 ? _a : 0 });
}
exports.toAgentListResponse = toAgentListResponse;
function toAgentToolBindingItem(binding) {
    return {
        id: binding.id,
        agentId: binding.agentId,
        toolId: binding.toolId,
        tool: toAgentLinkedToolResponse(binding.tool),
    };
}
exports.toAgentToolBindingItem = toAgentToolBindingItem;
function toAgentToolBindingItemList(bindings) {
    return bindings.map((binding) => toAgentToolBindingItem(binding));
}
exports.toAgentToolBindingItemList = toAgentToolBindingItemList;
function toAgentToolsBindingResponse(agentId, appClientId, bindings) {
    const agentTools = toAgentToolBindingItemList(bindings);
    return {
        agentId,
        appClientId,
        tools: agentTools.map(({ tool }) => tool),
        agentTools,
    };
}
exports.toAgentToolsBindingResponse = toAgentToolsBindingResponse;
function toAgentWithToolsResponseList(rows) {
    return rows.map((row) => toAgentWithToolsResponse(row));
}
exports.toAgentWithToolsResponseList = toAgentWithToolsResponseList;
function toAgentListResponseList(rows) {
    return rows.map((row) => toAgentListResponse(row));
}
exports.toAgentListResponseList = toAgentListResponseList;
//# sourceMappingURL=agent.mapper.js.map