"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSkillWhereForAppClient = exports.buildSkillWhereForAgent = exports.buildSkillOrderBy = exports.buildSkillFilterFields = void 0;
const pagination_1 = require("../../../common/pagination");
function buildSkillFilterFields(query) {
    var _a, _b, _c;
    const where = {};
    if (query.id != null) {
        where.id = query.id;
    }
    if (query.isActive != null) {
        where.isActive = query.isActive;
    }
    if (query.riskLevel != null) {
        where.riskLevel = query.riskLevel;
    }
    if ((_a = query.name) === null || _a === void 0 ? void 0 : _a.trim()) {
        where.name = { contains: query.name.trim(), mode: 'insensitive' };
    }
    if ((_b = query.capabilityKey) === null || _b === void 0 ? void 0 : _b.trim()) {
        where.capabilityKey = {
            contains: query.capabilityKey.trim(),
            mode: 'insensitive',
        };
    }
    if ((_c = query.keyword) === null || _c === void 0 ? void 0 : _c.trim()) {
        const keyword = query.keyword.trim();
        where.OR = [
            { name: { contains: keyword, mode: 'insensitive' } },
            { description: { contains: keyword, mode: 'insensitive' } },
            { capabilityKey: { contains: keyword, mode: 'insensitive' } },
        ];
    }
    return where;
}
exports.buildSkillFilterFields = buildSkillFilterFields;
function buildSkillOrderBy(orderBy, order) {
    const direction = (0, pagination_1.resolveSortOrder)(order);
    switch (orderBy !== null && orderBy !== void 0 ? orderBy : 'createdAt') {
        case 'id':
            return { id: direction };
        case 'name':
            return { name: direction };
        case 'capabilityKey':
            return { capabilityKey: direction };
        case 'isActive':
            return { isActive: direction };
        case 'riskLevel':
            return { riskLevel: direction };
        case 'updatedAt':
            return { updatedAt: direction };
        case 'createdAt':
        default:
            return { createdAt: direction };
    }
}
exports.buildSkillOrderBy = buildSkillOrderBy;
function buildSkillWhereForAgent(agentId, appClientId, query) {
    return Object.assign({ appClientId, agentSkills: { some: { agentId } } }, buildSkillFilterFields(query));
}
exports.buildSkillWhereForAgent = buildSkillWhereForAgent;
function buildSkillWhereForAppClient(appClientId, query, agentId) {
    return Object.assign(Object.assign({ appClientId }, (agentId != null ? { agentSkills: { some: { agentId } } } : {})), buildSkillFilterFields(query));
}
exports.buildSkillWhereForAppClient = buildSkillWhereForAppClient;
//# sourceMappingURL=skill-query.util.js.map