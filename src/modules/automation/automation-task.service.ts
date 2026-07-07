import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  AutomationTaskDetail,
  AutomationTaskListFilter,
  AutomationTaskListItem,
} from './automation.types';
import type { AutomationTaskSourceProvider } from './providers/automation-task-source.provider';
import { PageActionRunTaskProvider } from './providers/page-action-run-task.provider';

@Injectable()
export class AutomationTaskService {
  private readonly providers: AutomationTaskSourceProvider[];

  constructor(pageActionRunTaskProvider: PageActionRunTaskProvider) {
    this.providers = [pageActionRunTaskProvider];
  }

  async list(
    filter: AutomationTaskListFilter,
  ): Promise<{ items: AutomationTaskListItem[]; total: number }> {
    const triggerSource = filter.triggerSource ?? 'all';
    if (triggerSource === 'webhook') {
      return { items: [], total: 0 };
    }

    const pageActionProvider = this.providers.find(
      (row) => row.triggerSource === 'page_action',
    );
    if (!pageActionProvider) {
      return { items: [], total: 0 };
    }
    return pageActionProvider.list(filter);
  }

  async getDetail(input: {
    kind: 'page_action_run' | 'webhook_approval';
    id: number;
    appClientId: number;
    userId: number;
  }): Promise<AutomationTaskDetail> {
    if (input.kind === 'webhook_approval') {
      throw new NotFoundException('Webhook automation tasks are not available yet');
    }
    const provider = this.providers.find((row) => row.triggerSource === 'page_action');
    const detail = await provider?.getDetail(input);
    if (!detail) {
      throw new NotFoundException('Automation task not found');
    }
    return detail;
  }
}
