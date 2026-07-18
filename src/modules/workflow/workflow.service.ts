import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import {
  resolvePagination,
  toPaginatedResult,
  type PaginatedResult,
} from '../../common/pagination';
import { listWorkflowPresetCatalog } from '../../core/workflow/workflow-preset.util';
import type { WorkflowProfile } from '../../core/workflow/workflow.types';
import { PrismaService } from '../../prisma/prisma.service';
import type { QueryWorkflowDto } from './dto/workflow.dto';
import {
  toWorkflowListItem,
  toWorkflowResponse,
  toWorkflowRevisionResponse,
  toWorkflowRevisionSummaryResponse,
} from './workflow.mapper';
import type {
  WorkflowListItem,
  WorkflowResponse,
  WorkflowRevisionResponse,
  WorkflowRevisionSummaryResponse,
} from './workflow.types';
import { WORKFLOW_DETAIL_INCLUDE, WORKFLOW_LIST_INCLUDE } from './workflow.types';

export type WorkflowEntryKind = 'skill' | 'page_action';

/**
 * Legacy Workflow（nodes JSON）只读 + 引用校验。
 * Intent/IR 创建与更新已迁到 FlowService（POST/PATCH /flow）。
 */
@Injectable()
export class WorkflowService {
  constructor(private readonly prisma: PrismaService) {}

  async listPresets(profile?: WorkflowProfile) {
    return listWorkflowPresetCatalog(profile);
  }

  async findOne(id: number): Promise<WorkflowResponse> {
    const row = await this.findEntityOrThrow(id);
    return toWorkflowResponse(row);
  }

  async remove(id: number): Promise<{ ok: true; id: number }> {
    await this.findEntityOrThrow(id);
    await this.prisma.workflow.delete({ where: { id } });
    return { ok: true, id };
  }

  async findPage(
    query: QueryWorkflowDto,
  ): Promise<PaginatedResult<WorkflowListItem>> {
    const { page, pageSize, skip, take } = resolvePagination(
      query.page,
      query.pageSize,
    );
    const where: Prisma.WorkflowWhereInput = {
      ...(query.appClientId != null ? { appClientId: query.appClientId } : {}),
      ...(query.profile != null ? { profile: query.profile } : {}),
      ...(query.isActive != null ? { isActive: query.isActive } : {}),
      ...(query.keyword?.trim()
        ? {
            OR: [
              { workflowKey: { contains: query.keyword.trim() } },
              { name: { contains: query.keyword.trim() } },
            ],
          }
        : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.workflow.findMany({
        where,
        skip,
        take,
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        include: WORKFLOW_LIST_INCLUDE,
      }),
      this.prisma.workflow.count({ where }),
    ]);
    return toPaginatedResult(
      rows.map(toWorkflowListItem),
      total,
      page,
      pageSize,
    );
  }

  async listRevisions(
    workflowId: number,
    query: { limit?: number; summary?: boolean } = {},
  ): Promise<WorkflowRevisionResponse[] | WorkflowRevisionSummaryResponse[]> {
    const workflow = await this.findEntityOrThrow(workflowId);
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    if (query.summary) {
      const rows = await this.prisma.workflowRevision.findMany({
        where: { workflowId },
        orderBy: { version: 'desc' },
        take: limit,
        select: {
          id: true,
          workflowId: true,
          version: true,
          deliverable: true,
          changeNote: true,
          createdAt: true,
        },
      });
      return rows.map((row) =>
        toWorkflowRevisionSummaryResponse(row, workflow.version),
      );
    }
    const rows = await this.prisma.workflowRevision.findMany({
      where: { workflowId },
      orderBy: { version: 'desc' },
      take: limit,
    });
    return rows.map((row) => toWorkflowRevisionResponse(row, workflow.version));
  }

  async findRevision(
    workflowId: number,
    version: number,
  ): Promise<WorkflowRevisionResponse> {
    const workflow = await this.findEntityOrThrow(workflowId);
    const row = await this.prisma.workflowRevision.findUnique({
      where: {
        workflowId_version: {
          workflowId,
          version,
        },
      },
    });
    if (!row) {
      throw new NotFoundException({
        code: 'WORKFLOW_REVISION_NOT_FOUND',
        message: `Workflow ${workflowId} revision version=${version} not found`,
      });
    }
    return toWorkflowRevisionResponse(row, workflow.version);
  }

  async assertWorkflowReferenceCompatible(input: {
    workflowId: number;
    appClientId: number;
    entry: WorkflowEntryKind;
  }): Promise<void> {
    void input.entry;
    const workflow = await this.prisma.workflow.findFirst({
      where: {
        id: input.workflowId,
        appClientId: input.appClientId,
        isActive: true,
      },
    });
    if (!workflow) {
      throw new BadRequestException(
        `Workflow ${input.workflowId} is not found or inactive for this AppClient`,
      );
    }
  }

  /** Skill 保存期：校验 legacy Workflow 引用与可选 pin revision。 */
  async assertSkillWorkflowBindingsCompatible(input: {
    workflowId: number;
    appClientId: number;
    workflowVersion?: number | null;
    skillToolIds: number[];
    skillHostToolIds: number[];
  }): Promise<void> {
    void input.skillToolIds;
    void input.skillHostToolIds;
    const workflow = await this.prisma.workflow.findFirst({
      where: {
        id: input.workflowId,
        appClientId: input.appClientId,
        isActive: true,
      },
      select: { id: true, version: true },
    });
    if (!workflow) {
      throw new BadRequestException(
        `Workflow ${input.workflowId} is not found or inactive for this AppClient`,
      );
    }

    const pinVersion = input.workflowVersion ?? null;
    if (pinVersion != null && pinVersion !== workflow.version) {
      const revision = await this.prisma.workflowRevision.findUnique({
        where: {
          workflowId_version: {
            workflowId: workflow.id,
            version: pinVersion,
          },
        },
      });
      if (!revision) {
        throw new BadRequestException(
          `Workflow ${input.workflowId} revision version=${pinVersion} not found`,
        );
      }
    }
  }

  async assertPageActionWorkflowBindingsCompatible(input: {
    workflowId: number;
    appClientId: number;
    workflowVersion?: number | null;
    pageActionHostToolId?: number | null;
  }): Promise<void> {
    void input.pageActionHostToolId;
    await this.assertWorkflowReferenceCompatible({
      workflowId: input.workflowId,
      appClientId: input.appClientId,
      entry: 'page_action',
    });
    const pinVersion = input.workflowVersion ?? null;
    if (pinVersion == null) {
      return;
    }
    const workflow = await this.prisma.workflow.findFirst({
      where: {
        id: input.workflowId,
        appClientId: input.appClientId,
        isActive: true,
      },
      select: { id: true, version: true },
    });
    if (!workflow || pinVersion === workflow.version) {
      return;
    }
    const revision = await this.prisma.workflowRevision.findUnique({
      where: {
        workflowId_version: {
          workflowId: workflow.id,
          version: pinVersion,
        },
      },
    });
    if (!revision) {
      throw new BadRequestException(
        `Workflow ${input.workflowId} revision version=${pinVersion} not found`,
      );
    }
  }

  private async findEntityOrThrow(id: number) {
    const row = await this.prisma.workflow.findUnique({
      where: { id },
      include: WORKFLOW_DETAIL_INCLUDE,
    });
    if (!row) {
      throw new NotFoundException(`Workflow ${id} not found`);
    }
    return row;
  }
}
