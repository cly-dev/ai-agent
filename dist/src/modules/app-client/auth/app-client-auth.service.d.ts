import { PrismaService } from '../../../prisma/prisma.service';
import type { ExternalAccountProfile } from '../../user/user.service';
import type { AppClientAuthConfig, AppClientAuthTestResult, ResolvedAppClientAuthConfig } from './app-client-auth.types';
export declare class AppClientAuthService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    loadResolvedAuthConfig(appClientId: number): Promise<ResolvedAppClientAuthConfig>;
    validateAuthConfigInput(raw: unknown): AppClientAuthConfig;
    verifyAccountToken(appClientId: number, accountToken: string): Promise<ExternalAccountProfile>;
    testAccountToken(appClientId: number, accountToken: string): Promise<AppClientAuthTestResult>;
    private verifyWithConfig;
}
