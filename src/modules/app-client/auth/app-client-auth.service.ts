import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type { ExternalAccountProfile } from '../../user/user.service';
import {
  parseAppClientAuthConfig,
  resolveAppClientAuthConfig,
} from './app-client-auth.config.util';
import { fetchHttpProfileAccount } from './app-client-auth-http.util';
import type {
  AppClientAuthConfig,
  AppClientAuthTestResult,
  ResolvedAppClientAuthConfig,
} from './app-client-auth.types';

@Injectable()
export class AppClientAuthService {
  constructor(private readonly prisma: PrismaService) {}

  async loadResolvedAuthConfig(
    appClientId: number,
  ): Promise<ResolvedAppClientAuthConfig> {
    const row = await this.prisma.appClient.findUnique({
      where: { id: appClientId },
      select: { authConfig: true },
    });
    if (!row) {
      throw new BadRequestException(`appClient ${appClientId} not found`);
    }
    return resolveAppClientAuthConfig(row.authConfig);
  }

  validateAuthConfigInput(raw: unknown): AppClientAuthConfig {
    const parsed = parseAppClientAuthConfig(raw);
    if (!parsed) {
      throw new BadRequestException('authConfig cannot be empty');
    }
    return parsed;
  }

  async verifyAccountToken(
    appClientId: number,
    accountToken: string,
  ): Promise<ExternalAccountProfile> {
    const config = await this.loadResolvedAuthConfig(appClientId);
    return this.verifyWithConfig(config, appClientId, accountToken);
  }

  async testAccountToken(
    appClientId: number,
    accountToken: string,
  ): Promise<AppClientAuthTestResult> {
    const config = await this.loadResolvedAuthConfig(appClientId);
    const profile = await this.verifyWithConfig(config, appClientId, accountToken);
    return {
      ok: true,
      source: config.source,
      profile: {
        employeeId: profile.employeeId,
        email: profile.email,
        username: profile.username,
        active: profile.active,
        nickName: profile.nickName,
        cnName: profile.cnName,
      },
    };
  }

  private async verifyWithConfig(
    config: ResolvedAppClientAuthConfig,
    appClientId: number,
    accountToken: string,
  ): Promise<ExternalAccountProfile> {
    const token = accountToken.trim();
    if (!token) {
      throw new BadRequestException('accountToken is required');
    }
    switch (config.provider) {
      case 'http_profile':
        if (!config.http) {
          throw new BadRequestException('http_profile auth missing http config');
        }
        return fetchHttpProfileAccount(config.http, token, appClientId);
      case 'jwt_shared_secret':
        throw new BadRequestException(
          'jwt_shared_secret provider is not implemented yet',
        );
      default:
        throw new BadRequestException('unsupported auth provider');
    }
  }
}
