"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hostToolContractWillDispatchLive = exports.hostToolContractDispatchesDsl = exports.resolveHostToolDeliveryContracts = exports.resolveHostToolDeliveryContract = exports.hostToolArgsSchemaIsStructured = exports.pickHostToolProseStreamArgKey = exports.isRegisteredHostTool = void 0;
const host_tool_string_arg_util_1 = require("./host-tool-string-arg.util");
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function isRegisteredHostTool(tool) {
    return Number.isInteger(tool.id) && tool.id > 0;
}
exports.isRegisteredHostTool = isRegisteredHostTool;
function readProperties(argsSchema) {
    if (!isRecord(argsSchema)) {
        return null;
    }
    const properties = argsSchema.properties;
    if (!isRecord(properties) || Object.keys(properties).length === 0) {
        return null;
    }
    return properties;
}
function schemaTypeIsStructured(type) {
    if (type === 'object' || type === 'array') {
        return true;
    }
    if (Array.isArray(type)) {
        return type.includes('object') || type.includes('array');
    }
    return false;
}
function propertyDefIsStructured(def) {
    if (!isRecord(def)) {
        return false;
    }
    if (schemaTypeIsStructured(def.type)) {
        return true;
    }
    if (isRecord(def.properties) || def.items != null) {
        return true;
    }
    return false;
}
function pickHostToolProseStreamArgKey(properties) {
    for (const key of host_tool_string_arg_util_1.HOST_TOOL_STRING_ARG_KEYS) {
        const def = properties[key];
        if (isRecord(def) && def.type === 'string') {
            return key;
        }
    }
    return null;
}
exports.pickHostToolProseStreamArgKey = pickHostToolProseStreamArgKey;
function hasStructuredProperty(properties) {
    return Object.values(properties).some((def) => propertyDefIsStructured(def));
}
function requiredHasStructuredProperty(argsSchema, properties) {
    const required = argsSchema.required;
    if (!Array.isArray(required)) {
        return false;
    }
    for (const key of required) {
        if (typeof key !== 'string' || key.length === 0) {
            continue;
        }
        if (propertyDefIsStructured(properties[key])) {
            return true;
        }
    }
    return false;
}
function instantStructuredContract(tool) {
    return {
        toolName: tool.name,
        produceMode: 'structured',
        delivery: 'instant',
        streamablePath: null,
    };
}
function hostToolArgsSchemaIsStructured(argsSchema, toolId) {
    if (toolId != null && isRegisteredHostTool({ id: toolId })) {
        return true;
    }
    const properties = readProperties(argsSchema);
    return properties != null && hasStructuredProperty(properties);
}
exports.hostToolArgsSchemaIsStructured = hostToolArgsSchemaIsStructured;
function resolveHostToolDeliveryContract(tool) {
    if (isRegisteredHostTool(tool)) {
        return instantStructuredContract(tool);
    }
    const properties = readProperties(tool.argsSchema);
    if (!properties) {
        return {
            toolName: tool.name,
            produceMode: 'prose_stream',
            delivery: 'observation',
            streamablePath: null,
        };
    }
    const prosePath = pickHostToolProseStreamArgKey(properties);
    const structured = hasStructuredProperty(properties);
    const requiredStructured = requiredHasStructuredProperty(tool.argsSchema, properties);
    if (requiredStructured || (structured && !prosePath)) {
        return instantStructuredContract(tool);
    }
    if (prosePath) {
        return {
            toolName: tool.name,
            produceMode: 'prose_stream',
            delivery: 'fill_stream',
            streamablePath: prosePath,
        };
    }
    const anyStringPath = (0, host_tool_string_arg_util_1.pickHostToolStringArgKey)(properties);
    if (anyStringPath && !structured) {
        return {
            toolName: tool.name,
            produceMode: 'prose_stream',
            delivery: 'fill_stream',
            streamablePath: anyStringPath,
        };
    }
    if (structured) {
        return instantStructuredContract(tool);
    }
    return {
        toolName: tool.name,
        produceMode: 'prose_stream',
        delivery: 'observation',
        streamablePath: null,
    };
}
exports.resolveHostToolDeliveryContract = resolveHostToolDeliveryContract;
function resolveHostToolDeliveryContracts(input) {
    const allowed = input.allowedToolNames;
    const out = [];
    for (const tool of input.hostTools) {
        if (allowed && !allowed.has(tool.name)) {
            continue;
        }
        out.push(resolveHostToolDeliveryContract(tool));
    }
    return out;
}
exports.resolveHostToolDeliveryContracts = resolveHostToolDeliveryContracts;
function hostToolContractDispatchesDsl(contract) {
    return contract.delivery === 'fill_stream' || contract.delivery === 'instant';
}
exports.hostToolContractDispatchesDsl = hostToolContractDispatchesDsl;
function hostToolContractWillDispatchLive(contract, isStreamEnabled) {
    if (contract.delivery === 'instant') {
        return true;
    }
    if (contract.delivery === 'fill_stream') {
        return isStreamEnabled;
    }
    return false;
}
exports.hostToolContractWillDispatchLive = hostToolContractWillDispatchLive;
//# sourceMappingURL=host-tool-delivery-contract.util.js.map