import type { ExternalAccountProfile } from '../../user/user.service';
import type { AppClientHttpAuthConfig, AppClientProfileFieldMapping } from './app-client-auth.types';
export declare function pickMappedField(source: Record<string, unknown>, path: string): unknown;
export declare function resolveProfilePayloadRoot(payload: unknown, responseRoot?: string): Record<string, unknown>;
export declare function mapHttpProfileResponse(payload: unknown, mapping: AppClientProfileFieldMapping | undefined, responseRoot?: string): Partial<ExternalAccountProfile> & {
    active: boolean;
};
export declare function parseFetchBody(response: Response): Promise<unknown>;
export declare function formatFetchError(error: unknown): string;
export declare function buildBrowserLikeHeaders(origin: string, extra?: Record<string, string>): Record<string, string>;
export declare function fetchHttpProfileAccount(http: AppClientHttpAuthConfig, accountToken: string, appClientId: number): Promise<ExternalAccountProfile>;
