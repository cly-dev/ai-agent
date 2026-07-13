"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveHostToolArgsTemplate = void 0;
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function readPathFromPageContext(pageContext, path) {
    const trimmed = path.trim();
    if (trimmed === 'page') {
        return pageContext.page;
    }
    if (trimmed === 'routePath') {
        return pageContext.routePath;
    }
    if (trimmed.startsWith('routeParams.')) {
        const key = trimmed.slice('routeParams.'.length);
        const params = pageContext.routeParams;
        if (!params || typeof params !== 'object') {
            return undefined;
        }
        return params[key];
    }
    if (trimmed === 'flowId') {
        return pageContext.flowId;
    }
    if (trimmed === 'programName') {
        return pageContext.programName;
    }
    if (trimmed.startsWith('entity.')) {
        const key = trimmed.slice('entity.'.length);
        const entity = pageContext.entity;
        if (!entity || typeof entity !== 'object') {
            return undefined;
        }
        return entity[key];
    }
    if (trimmed.startsWith('metadata.')) {
        const key = trimmed.slice('metadata.'.length);
        const metadata = pageContext.metadata;
        if (!metadata || typeof metadata !== 'object') {
            return undefined;
        }
        return metadata[key];
    }
    return undefined;
}
function resolveTemplateValue(value, pageContext) {
    if (typeof value === 'string') {
        const match = /^\$([a-zA-Z][\w.]*)$/.exec(value.trim());
        if (match) {
            return readPathFromPageContext(pageContext, match[1]);
        }
        return value;
    }
    if (Array.isArray(value)) {
        return value.map((item) => resolveTemplateValue(item, pageContext));
    }
    if (isRecord(value)) {
        const next = {};
        for (const [key, nested] of Object.entries(value)) {
            next[key] = resolveTemplateValue(nested, pageContext);
        }
        return next;
    }
    return value;
}
function resolveHostToolArgsTemplate(template, pageContext) {
    if (!isRecord(template)) {
        return {};
    }
    const resolved = resolveTemplateValue(template, pageContext);
    return isRecord(resolved) ? resolved : {};
}
exports.resolveHostToolArgsTemplate = resolveHostToolArgsTemplate;
//# sourceMappingURL=host-tool-args-template.util.js.map