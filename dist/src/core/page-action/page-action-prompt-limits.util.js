"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertPageActionPromptLimits = void 0;
const common_1 = require("@nestjs/common");
const page_action_constants_1 = require("./page-action.constants");
function assertPageActionPromptLimits(input) {
    var _a;
    if (input.systemPrompt.length > page_action_constants_1.PAGE_ACTION_PROMPT_LIMITS.systemPromptMax) {
        throw new common_1.BadRequestException({
            code: 'PROMPT_TOO_LARGE',
            message: 'systemPrompt exceeds limit',
        });
    }
    const instruction = (_a = input.instruction) === null || _a === void 0 ? void 0 : _a.trim();
    if (instruction &&
        instruction.length > page_action_constants_1.PAGE_ACTION_PROMPT_LIMITS.instructionMax) {
        throw new common_1.BadRequestException({
            code: 'PROMPT_TOO_LARGE',
            message: 'instruction exceeds limit',
        });
    }
    if (input.context) {
        const serialized = JSON.stringify(input.context);
        if (serialized.length > page_action_constants_1.PAGE_ACTION_PROMPT_LIMITS.contextJsonMax) {
            throw new common_1.BadRequestException({
                code: 'PROMPT_TOO_LARGE',
                message: 'context exceeds limit',
            });
        }
    }
}
exports.assertPageActionPromptLimits = assertPageActionPromptLimits;
//# sourceMappingURL=page-action-prompt-limits.util.js.map