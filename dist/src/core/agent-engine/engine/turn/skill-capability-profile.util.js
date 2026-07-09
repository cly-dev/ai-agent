"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSkillCapabilityProfile = void 0;
const skill_runnable_util_1 = require("../../../skill/skill-runnable.util");
function buildSkillCapabilityProfile(input) {
    var _a;
    const caps = (0, skill_runnable_util_1.normalizeSkillRunnableCapabilities)({
        skillToolIds: input.skillToolIds,
        hostToolIds: input.hostToolIds,
    });
    const runnableKind = (_a = input.runnableKind) !== null && _a !== void 0 ? _a : (0, skill_runnable_util_1.deriveSkillRunnableKind)(caps);
    const isHostOnly = (0, skill_runnable_util_1.skillIsHostOnlySkill)(caps);
    const hasHostTools = caps.hostToolIds.length > 0;
    const hasHttpTools = caps.skillToolIds.length > 0;
    return {
        skillId: input.skillId,
        skillName: input.skillName,
        runnableKind,
        hasHttpTools,
        hasHostTools,
        isHostOnly,
        isHttpOnly: hasHttpTools && !hasHostTools,
        channels: input.channels,
    };
}
exports.buildSkillCapabilityProfile = buildSkillCapabilityProfile;
//# sourceMappingURL=skill-capability-profile.util.js.map