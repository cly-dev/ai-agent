export type WriteToolBusinessFailure = {
    code: string;
    message: string;
};
export declare function assessWriteToolBusinessFailure(output: unknown): WriteToolBusinessFailure | null;
