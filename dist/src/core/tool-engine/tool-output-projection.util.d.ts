import type { ProjectedToolOutput, ToolResponseProfile } from './tool-response-profile.types';
export declare function parseResponseProfile(raw: unknown): ToolResponseProfile | null;
export declare function projectToolOutput(raw: unknown, userQuestion: string, profile: ToolResponseProfile | null): ProjectedToolOutput;
export declare function formatFieldLabelsForPrompt(fieldLabels: Record<string, string>, enumLabelsByPath: Record<string, Record<string, string>>, fieldDescriptions?: Record<string, string>): string;
