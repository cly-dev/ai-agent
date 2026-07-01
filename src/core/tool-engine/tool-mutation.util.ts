import { parseAgentMetadata } from './tool-agent-metadata.util';
import { ToolMode } from './tool-agent-metadata.types';

export function isMutationTool(agentMetadata: unknown): boolean {
  const meta = parseAgentMetadata(agentMetadata);
  if (!meta) {
    return false;
  }
  return meta.isMutation || meta.mode === ToolMode.WRITE;
}
