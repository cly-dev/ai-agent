import { ToolLevel } from '../../../generated/prisma/client';
export declare function maxToolLevel(levels: ToolLevel[]): ToolLevel;
export declare function isWriteRiskLevel(level: ToolLevel): boolean;
export declare function toolRequiresWriteConfirmation(input: {
    riskLevel: ToolLevel;
    agentMetadata: unknown;
}): boolean;
export declare function skillRequiresWriteConfirmation(riskLevel: ToolLevel): boolean;
export declare function resolveToolWriteConfirmationReason(input: {
    riskLevel: ToolLevel;
    agentMetadata: unknown;
}): string;
