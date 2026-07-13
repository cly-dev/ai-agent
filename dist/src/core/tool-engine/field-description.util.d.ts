type InferFieldContext = {
    toolName?: string;
    toolDescription?: string;
};
declare function humanizeFieldName(fieldName: string): string;
export declare function inferFieldDescription(fieldName: string, sampleValue?: unknown, context?: InferFieldContext): string;
export declare function inferFieldLabel(fieldName: string): string;
export { humanizeFieldName, type InferFieldContext };
