"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRequestedSkillRunError = exports.RequestedSkillRunError = void 0;
class RequestedSkillRunError extends Error {
    constructor(code, message) {
        super(message);
        this.name = 'RequestedSkillRunError';
        this.code = code;
    }
}
exports.RequestedSkillRunError = RequestedSkillRunError;
function isRequestedSkillRunError(error) {
    return error instanceof RequestedSkillRunError;
}
exports.isRequestedSkillRunError = isRequestedSkillRunError;
//# sourceMappingURL=requested-skill-run.error.js.map