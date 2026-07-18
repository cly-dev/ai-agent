import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  AutomationTaskDetail,
  AutomationTaskListFilter,
  AutomationTaskListItem,
} from '../automation.types';
import {
  AUTOMATION_PAGE_ACTION_RUN_INCLUDE,
  resolvePageActionRunStatusWhere,
  toAutomationTaskDetailFromPageActionRun,
  toAutomationTaskFromPageActionRun,
} from '../automation-task.mapper';
import type { AutomationTaskSourceProvider } from './automation-task-source.provider';

@Injectable()
export class PageActionRunTaskProvider implements AutomationTaskSourceProvider {
  readonly triggerSource = 'page_action' as const;

  constructor(private readonly prisma: PrismaService) {}

  async list(filter: AutomationTaskListFilter): Promise<{
    items: AutomationTaskListItem[];
    total: number;
  }> {
    const limit = Math.min(filter.limit ?? 20, 100);
    const offset = filter.offset ?? 0;
    const where: Prisma.PageActionRunWhereInput = {
      appClientId: filter.appClientId,
      userId: filter.userId,
      status: resolvePageActionRunStatusWhere(filter.status),
      ...(filter.actionKey?.trim() || filter.workflowKey?.trim()
        ? {
            pageAction: {
              ...(filter.actionKey?.trim()
                ? { actionKey: { contains: filter.actionKey.trim() } }
                : {}),
              // 查询参数仍叫 workflowKey：同时匹配 legacy Workflow 与新 Flow。
              ...(filter.workflowKey?.trim()
                ? {
                    OR: [
                      {
                        workflow: {
                          workflowKey: filter.workflowKey.trim(),
                        },
                      },
                      {
                        flow: { flowKey: filter.workflowKey.trim() },
                      },
                    ],
                  }
                : {}),
            },
          }
        : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.pageActionRun.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: AUTOMATION_PAGE_ACTION_RUN_INCLUDE,
      }),
      this.prisma.pageActionRun.count({ where }),
    ]);

    return {
      items: rows.map(toAutomationTaskFromPageActionRun),
      total,
    };
  }

  async getDetail(input: {
    id: number;
    appClientId: number;
    userId: number;
  }): Promise<AutomationTaskDetail | null> {
    const row = await this.prisma.pageActionRun.findFirst({
      where: {
        id: input.id,
        appClientId: input.appClientId,
        userId: input.userId,
      },
      include: AUTOMATION_PAGE_ACTION_RUN_INCLUDE,
    });
    if (!row) {
      return null;
    }
    return toAutomationTaskDetailFromPageActionRun(row);
  }
}
