import { RequestMethod } from '@nestjs/common';
export type ClientPublicApiRoute = {
    path: string;
    method: RequestMethod;
};
export declare const CLIENT_PUBLIC_API_EXCLUDES: ClientPublicApiRoute[];
export declare function normalizeRequestPath(path: string): string;
export declare function stripAdminPrefix(path: string): string;
export declare function matchesClientPublicApiPath(path: string): boolean;
