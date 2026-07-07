"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toSkillListResponseList = exports.toSkillResponseList = exports.toSkillListResponse = exports.toSkillResponse = void 0;
const risk_level_util_1 = require("../../../core/risk/risk-level.util");
const host_tool_mapper_1 = require("../../host-tool/host-tool.mapper");
function mapSkillToolBindings(skillTools) {
    return skillTools.map((binding) => ({
        id: binding.id,
        toolId: binding.toolId,
        isRequired: binding.isRequired,
        requiresWriteConfirmation: (0, risk_level_util_1.toolRequiresWriteConfirmation)({
            riskLevel: binding.tool.riskLevel,
            agentMetadata: binding.tool.agentMetadata,
        }),
        tool: binding.tool,
    }));
}
function mapSkillCore(row) {
    return {
        id: row.id,
        appClientId: row.appClientId,
        appClientName: row.appClient.name,
        appClient: row.appClient,
        name: row.name,
        capabilityKey: row.capabilityKey,
        description: row.description,
        prompt: row.prompt,
        riskLevel: row.riskLevel,
        requiresWriteConfirmation: (0, risk_level_util_1.skillRequiresWriteConfirmation)(row.riskLevel),
        config: row.config,
        workflowId: row.workflowId,
        workflowVersion: row.workflowVersion,
        workflowOverrides: row.workflowOverrides,
        isActive: row.isActive,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}
function toSkillResponse(row) {
    var _a, _b, _c, _d, _e, _f;
    const skillHostTools = row.skillHostTools.map((binding) => (0, host_tool_mapper_1.toSkillHostToolBindingResponse)(binding));
    return Object.assign(Object.assign({}, mapSkillCore(row)), { skillTools: mapSkillToolBindings(row.skillTools), skillHostTools, hostTools: skillHostTools.map((binding) => binding.hostTool), toolCount: (_b = (_a = row._count) === null || _a === void 0 ? void 0 : _a.skillTools) !== null && _b !== void 0 ? _b : row.skillTools.length, hostToolCount: skillHostTools.length, roleSkillCount: (_d = (_c = row._count) === null || _c === void 0 ? void 0 : _c.roleSkills) !== null && _d !== void 0 ? _d : 0, agentSkillCount: (_f = (_e = row._count) === null || _e === void 0 ? void 0 : _e.agentSkills) !== null && _f !== void 0 ? _f : 0 });
}
exports.toSkillResponse = toSkillResponse;
function toSkillListResponse(row) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    return Object.assign(Object.assign({}, mapSkillCore(row)), { skillTools: mapSkillToolBindings(row.skillTools), skillHostTools: [], hostTools: [], toolCount: (_b = (_a = row._count) === null || _a === void 0 ? void 0 : _a.skillTools) !== null && _b !== void 0 ? _b : row.skillTools.length, hostToolCount: (_d = (_c = row._count) === null || _c === void 0 ? void 0 : _c.skillHostTools) !== null && _d !== void 0 ? _d : 0, roleSkillCount: (_f = (_e = row._count) === null || _e === void 0 ? void 0 : _e.roleSkills) !== null && _f !== void 0 ? _f : 0, agentSkillCount: (_h = (_g = row._count) === null || _g === void 0 ? void 0 : _g.agentSkills) !== null && _h !== void 0 ? _h : 0 });
}
exports.toSkillListResponse = toSkillListResponse;
function toSkillResponseList(rows) {
    return rows.map((row) => toSkillResponse(row));
}
exports.toSkillResponseList = toSkillResponseList;
function toSkillListResponseList(rows) {
    return rows.map((row) => toSkillListResponse(row));
}
exports.toSkillListResponseList = toSkillListResponseList;
//# sourceMappingURL=skill.mapper.js.map