"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMutationTool = void 0;
const tool_agent_metadata_util_1 = require("./tool-agent-metadata.util");
const tool_agent_metadata_types_1 = require("./tool-agent-metadata.types");
function isMutationTool(agentMetadata) {
    const meta = (0, tool_agent_metadata_util_1.parseAgentMetadata)(agentMetadata);
    if (!meta) {
        return false;
    }
    return meta.isMutation || meta.mode === tool_agent_metadata_types_1.ToolMode.WRITE;
}
exports.isMutationTool = isMutationTool;
//# sourceMappingURL=tool-mutation.util.js.map