"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderPromptTemplate = void 0;
function renderPromptTemplate(template, variables) {
    return template.replace(/\{\{(\w+)\}\}/g, (_match, name) => {
        const value = variables[name];
        if (value === undefined || value === null) {
            return '';
        }
        return String(value);
    });
}
exports.renderPromptTemplate = renderPromptTemplate;
//# sourceMappingURL=prompt-template.render.util.js.map