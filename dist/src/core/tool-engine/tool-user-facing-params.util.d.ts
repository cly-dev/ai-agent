import type { CompactToolInput, ToolParamCompact } from './tool-decision-input.util';
export declare function isSortParam(name: string): boolean;
export declare function isInfraToolParam(row: Pick<ToolParamCompact, 'name' | 'in'>): boolean;
export declare function isInfraParamName(name: string): boolean;
export declare function listUserFacingRequiredParamNames(input: CompactToolInput): string[];
export declare function listOptionalFilterParamNames(input: CompactToolInput): string[];
