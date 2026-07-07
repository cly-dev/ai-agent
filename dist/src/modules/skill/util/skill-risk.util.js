"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveSkillRiskLevel = void 0;
const client_1 = require("../../../../generated/prisma/client");
const risk_level_util_1 = require("../../../core/risk/risk-level.util");
function resolveSkillRiskLevel(input) {
    const fromTools = input.toolRiskLevels.length > 0
        ? (0, risk_level_util_1.maxToolLevel)(input.toolRiskLevels)
        : client_1.ToolLevel.L1;
    if (input.explicit == null) {
        return fromTools;
    }
    return (0, risk_level_util_1.maxToolLevel)([input.explicit, fromTools]);
}
exports.resolveSkillRiskLevel = resolveSkillRiskLevel;
//# sourceMappingURL=skill-risk.util.js.map