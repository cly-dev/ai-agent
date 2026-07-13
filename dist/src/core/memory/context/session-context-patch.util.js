"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.atomicMergePatchSessionContext = exports.atomicShallowPatchSessionContext = void 0;
const DEFAULT_PATCH_MAX_RETRIES = 8;
function parseSessionContextRecord(raw) {
    if (raw === null) {
        return {};
    }
    try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return {};
        }
        return parsed;
    }
    catch (_a) {
        return {};
    }
}
async function atomicPatchSessionContextLoop(input) {
    var _a, _b;
    const maxRetries = (_a = input.maxRetries) !== null && _a !== void 0 ? _a : DEFAULT_PATCH_MAX_RETRIES;
    for (let attempt = 0; attempt < maxRetries; attempt += 1) {
        await input.client.watch(input.key);
        const raw = await input.client.get(input.key);
        const current = parseSessionContextRecord(raw);
        if (raw !== null && Object.keys(current).length === 0) {
            (_b = input.onCorruptJson) === null || _b === void 0 ? void 0 : _b.call(input);
        }
        const partial = input.buildPartial(current);
        const merged = Object.assign(Object.assign({}, current), partial);
        const body = JSON.stringify(merged);
        const execResult = await input.client
            .multi()
            .set(input.key, body, 'EX', input.ttlSeconds)
            .exec();
        if (execResult !== null) {
            return merged;
        }
    }
    throw new Error(`session context atomic patch failed after ${maxRetries} concurrent conflicts`);
}
async function atomicShallowPatchSessionContext(input) {
    return atomicPatchSessionContextLoop({
        client: input.client,
        key: input.key,
        ttlSeconds: input.ttlSeconds,
        maxRetries: input.maxRetries,
        onCorruptJson: input.onCorruptJson,
        buildPartial: () => input.partial,
    });
}
exports.atomicShallowPatchSessionContext = atomicShallowPatchSessionContext;
async function atomicMergePatchSessionContext(input) {
    return atomicPatchSessionContextLoop({
        client: input.client,
        key: input.key,
        ttlSeconds: input.ttlSeconds,
        maxRetries: input.maxRetries,
        onCorruptJson: input.onCorruptJson,
        buildPartial: input.merge,
    });
}
exports.atomicMergePatchSessionContext = atomicMergePatchSessionContext;
//# sourceMappingURL=session-context-patch.util.js.map