import type { ExternalAccountProfile } from '../../user/user.service';
export declare function tokenIdentityDigest(accountToken: string): string;
export declare function normalizeExternalAccountProfile(partial: Partial<ExternalAccountProfile> & {
    active?: boolean;
}, input: {
    appClientId: number;
    accountToken: string;
}): ExternalAccountProfile;
