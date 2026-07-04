export declare function getCorsAllowlist(): string[];
export declare const getClientCorsAllowlist: typeof getCorsAllowlist;
export declare function shouldReflectCorsOrigin(): boolean;
export declare const shouldReflectClientCorsOrigin: typeof shouldReflectCorsOrigin;
export declare function resolveAllowedCorsOrigin(origin: string | undefined): string | null;
export declare const resolveAllowedClientCorsOrigin: typeof resolveAllowedCorsOrigin;
