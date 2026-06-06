import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IntegrationAuthMode, Prisma } from '../../../generated/prisma/client';
import {
  type PaginatedResult,
  resolvePagination,
  resolveSortOrder,
  toPaginatedResult,
} from '../../common/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateIntegrationDto } from './dto/create-integration.dto';
import {
  QueryIntegrationDto,
  type IntegrationOrderByField,
} from './dto/query-integration.dto';
import { UpdateIntegrationDto } from './dto/update-integration.dto';
import {
  toIntegrationResponse,
  toIntegrationResponseList,
} from './integration.mapper';
import {
  INTEGRATION_DETAIL_INCLUDE,
  type IntegrationConnectionTestResult,
  type IntegrationResponse,
} from './integration.types';
import type { TestIntegrationConnectionDto } from './dto/test-integration-connection.dto';

const CONNECTION_PROBE_TIMEOUT_MS = 10_000;

@Injectable()
export class IntegrationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateIntegrationDto): Promise<IntegrationResponse> {
    await this.assertAppClientExists(dto.appClientId);
    const name = dto.name.trim();
    const baseUrl = dto.baseUrl.trim();
    if (!name) {
      throw new BadRequestException('name is required');
    }
    if (!baseUrl) {
      throw new BadRequestException('baseUrl is required');
    }
    const row = await this.prisma.integration.create({
      data: {
        appClientId: dto.appClientId,
        name,
        baseUrl,
        apiKey: this.normalizeOptionalSecret(dto.apiKey),
        description: this.normalizeOptionalText(dto.description),
        authMode: dto.authMode ?? IntegrationAuthMode.USER_PREFERRED,
      },
      include: INTEGRATION_DETAIL_INCLUDE,
    });
    return toIntegrationResponse(row);
  }

  async findPageByAppClientId(
    appClientId: number,
    query: QueryIntegrationDto,
  ): Promise<PaginatedResult<IntegrationResponse>> {
    await this.assertAppClientExists(appClientId);
    return this.findPage({ ...query, appClientId });
  }

  async findPage(
    query: QueryIntegrationDto,
  ): Promise<PaginatedResult<IntegrationResponse>> {
    const { page, pageSize, skip, take } = resolvePagination(
      query.page,
      query.pageSize,
    );
    const where = this.buildWhere(query);
    const orderBy = this.buildOrderBy(query.orderBy, query.order);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.integration.findMany({
        where,
        orderBy,
        skip,
        take,
        include: INTEGRATION_DETAIL_INCLUDE,
      }),
      this.prisma.integration.count({ where }),
    ]);
    return toPaginatedResult(
      toIntegrationResponseList(rows),
      total,
      page,
      pageSize,
    );
  }

  async findOne(id: number): Promise<IntegrationResponse> {
    const row = await this.prisma.integration.findUnique({
      where: { id },
      include: INTEGRATION_DETAIL_INCLUDE,
    });
    if (!row) {
      throw new NotFoundException(`integration ${id} not found`);
    }
    return toIntegrationResponse(row);
  }

  async update(
    id: number,
    dto: UpdateIntegrationDto,
  ): Promise<IntegrationResponse> {
    const existing = await this.findOne(id);
    const appClientId = dto.appClientId ?? existing.appClientId;
    if (dto.appClientId != null) {
      await this.assertAppClientExists(appClientId);
    }
    try {
      const row = await this.prisma.integration.update({
        where: { id },
        data: {
          appClientId: dto.appClientId,
          name: dto.name?.trim(),
          baseUrl: dto.baseUrl?.trim(),
          apiKey:
            dto.apiKey === undefined
              ? undefined
              : this.normalizeOptionalSecret(dto.apiKey),
          description:
            dto.description === undefined
              ? undefined
              : this.normalizeOptionalText(dto.description),
          authMode: dto.authMode,
        },
        include: INTEGRATION_DETAIL_INCLUDE,
      });
      return toIntegrationResponse(row);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`integration ${id} not found`);
      }
      throw error;
    }
  }

  async testConnection(
    options: { id?: number } & TestIntegrationConnectionDto,
  ): Promise<IntegrationConnectionTestResult> {
    let baseUrl = options.baseUrl?.trim();
    let apiKey =
      options.apiKey === undefined
        ? undefined
        : this.normalizeOptionalSecret(options.apiKey);

    if (options.id != null) {
      const row = await this.prisma.integration.findUnique({
        where: { id: options.id },
        select: { baseUrl: true, apiKey: true },
      });
      if (!row) {
        throw new NotFoundException(`integration ${options.id} not found`);
      }
      baseUrl = baseUrl || row.baseUrl.trim();
      if (options.apiKey === undefined) {
        apiKey = row.apiKey;
      }
    }

    if (!baseUrl) {
      throw new BadRequestException('baseUrl is required');
    }

    return this.probeBaseUrl(baseUrl, apiKey ?? null);
  }

  async remove(id: number): Promise<IntegrationResponse> {
    await this.findOne(id);
    const relatedToolCount = await this.prisma.tool.count({
      where: { integrationId: id },
    });
    if (relatedToolCount > 0) {
      throw new BadRequestException(
        `integration ${id} 仍关联 ${relatedToolCount} 个 tool，请先取消关联 tool 后再删除`,
      );
    }
    try {
      const row = await this.prisma.integration.delete({
        where: { id },
        include: INTEGRATION_DETAIL_INCLUDE,
      });
      return toIntegrationResponse(row);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          `integration ${id} 仍有关联 tool，请先取消关联 tool 后再删除`,
        );
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`integration ${id} not found`);
      }
      throw error;
    }
  }

  private buildWhere(
    query: QueryIntegrationDto,
  ): Prisma.IntegrationWhereInput {
    const where: Prisma.IntegrationWhereInput = {};
    if (query.id != null) {
      where.id = query.id;
    }
    if (query.appClientId != null) {
      where.appClientId = query.appClientId;
    }
    if (query.name?.trim()) {
      where.name = { contains: query.name.trim(), mode: 'insensitive' };
    }
    if (query.baseUrl?.trim()) {
      where.baseUrl = { contains: query.baseUrl.trim(), mode: 'insensitive' };
    }
    if (query.authMode != null) {
      where.authMode = query.authMode;
    }
    if (query.keyword?.trim()) {
      const keyword = query.keyword.trim();
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { baseUrl: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
      ];
    }
    return where;
  }

  private buildOrderBy(
    orderBy?: IntegrationOrderByField,
    order?: 'asc' | 'desc',
  ): Prisma.IntegrationOrderByWithRelationInput {
    const direction = resolveSortOrder(order);
    switch (orderBy ?? 'id') {
      case 'name':
        return { name: direction };
      case 'createdAt':
        return { createdAt: direction };
      case 'updatedAt':
        return { updatedAt: direction };
      case 'baseUrl':
        return { baseUrl: direction };
      case 'id':
      default:
        return { id: direction };
    }
  }

  private async assertAppClientExists(appClientId: number): Promise<void> {
    const row = await this.prisma.appClient.findUnique({
      where: { id: appClientId },
      select: { id: true },
    });
    if (!row) {
      throw new BadRequestException(`appClient ${appClientId} not found`);
    }
  }

  private normalizeOptionalSecret(value?: string | null): string | null {
    if (value == null) {
      return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private normalizeOptionalText(value?: string | null): string | null {
    if (value == null) {
      return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private async probeBaseUrl(
    baseUrl: string,
    apiKey: string | null,
  ): Promise<IntegrationConnectionTestResult> {
    let url: URL;
    try {
      url = new URL(baseUrl);
    } catch {
      throw new BadRequestException('baseUrl must be a valid URL');
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new BadRequestException('baseUrl must use http or https');
    }

    const headers: Record<string, string> = {
      Accept: 'application/json, text/plain, */*',
      'User-Agent': 'agent-server-integration-probe/1.0',
    };
    if (apiKey) {
      headers.Authorization = apiKey.includes(' ')
        ? apiKey
        : `Bearer ${apiKey}`;
    }

    const startedAt = Date.now();
    const headResult = await this.fetchProbe(url.toString(), 'HEAD', headers);
    if (headResult.reachable) {
      return { ...headResult, durationMs: Date.now() - startedAt };
    }
    if (headResult.statusCode === 405 || headResult.statusCode === 501) {
      const getResult = await this.fetchProbe(url.toString(), 'GET', headers);
      return { ...getResult, durationMs: Date.now() - startedAt };
    }
    return { ...headResult, durationMs: Date.now() - startedAt };
  }

  private async fetchProbe(
    url: string,
    method: 'GET' | 'HEAD',
    headers: Record<string, string>,
  ): Promise<Omit<IntegrationConnectionTestResult, 'durationMs'>> {
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      CONNECTION_PROBE_TIMEOUT_MS,
    );
    try {
      const response = await fetch(url, {
        method,
        headers,
        signal: controller.signal,
        redirect: 'follow',
      });
      return {
        reachable: true,
        url,
        method,
        statusCode: response.status,
        statusText: response.statusText,
      };
    } catch (error) {
      const message = this.formatFetchError(error);
      const aborted =
        error instanceof Error && error.name === 'AbortError';
      return {
        reachable: false,
        url,
        method,
        error: aborted
          ? `request timed out after ${CONNECTION_PROBE_TIMEOUT_MS}ms`
          : message,
      };
    } finally {
      clearTimeout(timer);
    }
  }

  private formatFetchError(error: unknown): string {
    if (!(error instanceof Error)) {
      return String(error);
    }
    const cause = (error as Error & { cause?: unknown }).cause;
    if (cause instanceof Error) {
      const code =
        'code' in cause && typeof cause.code === 'string' ? cause.code : '';
      return code ? `${cause.message} (${code})` : cause.message;
    }
    return error.message;
  }
}
