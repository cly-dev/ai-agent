"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWorkflowProfileCompatibleWithEntry = void 0;
function isWorkflowProfileCompatibleWithEntry(profile, entry) {
    if (profile === 'shared') {
        return true;
    }
    if (entry === 'skill') {
        return profile === 'chat_skill';
    }
    return profile === 'page_action';
}
exports.isWorkflowProfileCompatibleWithEntry = isWorkflowProfileCompatibleWithEntry;
//# sourceMappingURL=workflow-profile.util.js.map