"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.summarizeHostToolsForLlmSchema = exports.buildHostLangChainTools = void 0;
const tools_1 = require("@langchain/core/tools");
const json_schema_to_zod_util_1 = require("../tool-engine/json-schema-to-zod.util");
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function buildHostLangChainTools(definitions) {
    const tools = [];
    const byName = new Map();
    for (const def of definitions) {
        const schema = isRecord(def.argsSchema) ? def.argsSchema : { type: 'object' };
        const parameters = (0, json_schema_to_zod_util_1.jsonSchemaToZod)(schema);
        const lcTool = (0, tools_1.tool)(async (input) => JSON.stringify({
            hostTool: def.name,
            acknowledged: true,
            args: input,
        }), {
            name: def.name,
            description: def.description,
            schema: parameters,
        });
        tools.push(lcTool);
        byName.set(def.name, lcTool);
    }
    return { tools, byName };
}
exports.buildHostLangChainTools = buildHostLangChainTools;
function summarizeHostToolsForLlmSchema(definitions) {
    return definitions.map((def) => ({
        name: def.name,
        description: def.description,
        argsSchema: def.argsSchema,
        execution: 'browser',
    }));
}
exports.summarizeHostToolsForLlmSchema = summarizeHostToolsForLlmSchema;
//# sourceMappingURL=host-tool-langchain.util.js.map