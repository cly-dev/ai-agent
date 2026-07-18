import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AppClientDsnGuard } from '../../auth/app-client-dsn.guard';
import { UserJwtAuthGuard } from '../../auth/user-jwt-auth.guard';
import {
  ApprovalRequestService,
  type ApprovalInboxRow,
} from '../../core/approval/approval-request.service';
import { ApprovalResumeService } from '../../core/approval/approval-resume.service';
import { resolveDraftRetryBudget } from '../../core/draft-review';
import { ApprovalDecideDto } from './dto/approval-decide.dto';
import { QueryApprovalInboxDto } from './dto/query-approval-inbox.dto';
import {
  buildApprovalWriteDraftPayload,
  resolveApprovalRowToolId,
} from './approval-write-draft.mapper';
import { buildApprovalEntityReferenceFromSnapshot } from '../../core/approval/build-approval-entity-reference.util';
import type { WriteToolPolicyRow } from '../../core/draft-review/load-write-tools-for-policy.util';

type AuthedRequest = Request & {
  user: { userId: number };
  appClient: { id: number };
};

@Controller('approval')
@UseGuards(UserJwtAuthGuard, AppClientDsnGuard)
export class ApprovalController {
  constructor(
    private readonly approvalRequests: ApprovalRequestService,
    private readonly approvalResume: ApprovalResumeService,
  ) {}

  private userId(req: AuthedRequest): number {
    return req.user.userId;
  }

  @Get('inbox')
  async listInbox(@Req() req: AuthedRequest, @Query() query: QueryApprovalInboxDto) {
    const rows = await this.approvalRequests.listInboxForApprover({
      appClientId: req.appClient.id,
      approverUserId: this.userId(req),
      status: query.status,
      limit: query.limit,
      offset: query.offset,
    });
    const toolMap = await this.approvalRequests.loadWriteToolsByIds(
      rows
        .map((row) => resolveApprovalRowToolId(row))
        .filter((id): id is number => id != null),
    );
    return {
      items: rows.map((row) => this.toInboxItem(row, toolMap)),
    };
  }

  @Get(':id')
  async getOne(
    @Req() req: AuthedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const row = await this.approvalRequests.findByIdForApprover(
      id,
      this.userId(req),
    );
    if (!row) {
      throw new NotFoundException('Approval request not found');
    }
    const toolId = resolveApprovalRowToolId(row);
    const toolMap = toolId
      ? await this.approvalRequests.loadWriteToolsByIds([toolId])
      : new Map<number, WriteToolPolicyRow>();
    return this.toInboxItem(row, toolMap);
  }

  @Post(':id/decide')
  async decide(
    @Req() req: AuthedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ApprovalDecideDto,
  ) {
    return this.approvalResume.decide({
      approvalRequestId: id,
      decidedByUserId: this.userId(req),
      decisionNote: body.reason ?? null,
      decision: body.decision,
    });
  }

  @Post(':id/confirm')
  async confirm(
    @Req() req: AuthedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.approvalResume.decide({
      approvalRequestId: id,
      decidedByUserId: this.userId(req),
      decision: { action: 'confirm' },
    });
  }

  @Post(':id/reject')
  async reject(
    @Req() req: AuthedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reason?: string },
  ) {
    await this.approvalResume.decide({
      approvalRequestId: id,
      decidedByUserId: this.userId(req),
      decisionNote: body?.reason ?? null,
      decision: { action: 'cancel' },
    });
    return { ok: true };
  }

  private toInboxItem(
    row: ApprovalInboxRow,
    toolMap: Map<number, WriteToolPolicyRow>,
  ) {
    const toolId = resolveApprovalRowToolId(row);
    const writeTool = toolId != null ? toolMap.get(toolId) ?? null : null;
    const { writeDraft, editPolicy } = buildApprovalWriteDraftPayload(
      row,
      writeTool,
    );
    // flow / workflow 二选一；workflowKey/Name 回退 flow，兼容只读旧字段的客户端。
    return {
      id: row.id,
      source: row.source,
      status: row.status,
      title: row.title,
      summary: row.summary,
      workflowId: row.workflowId,
      workflowVersion: row.workflowVersion,
      flowId: row.flowId,
      flowVersion: row.flowVersion,
      workflowKey: row.workflow?.workflowKey ?? row.flow?.flowKey ?? null,
      workflowName: row.workflow?.name ?? row.flow?.name ?? null,
      flowKey: row.flow?.flowKey ?? null,
      flowName: row.flow?.name ?? null,
      nodeId: row.nodeId,
      sessionId: row.sessionId,
      pageActionRunId: row.pageActionRunId,
      initiator: row.initiator
        ? {
            id: row.initiator.id,
            username: row.initiator.username,
            employeeId: row.initiator.employeeId,
          }
        : null,
      createdAt: row.createdAt,
      decidedAt: row.decidedAt,
      writeDraft,
      editPolicy,
      previewBlocks: row.previewBlocks,
      pendingWrite: {
        tool: writeDraft.tool.name,
        riskLevel: writeDraft.tool.riskLevel,
      },
      draftReview: this.extractDraftReviewBudget(row),
      entityReference: buildApprovalEntityReferenceFromSnapshot(
        row.resumeSnapshot,
      ),
    };
  }

  private extractDraftReviewBudget(row: { resumeSnapshot: unknown }) {
    const snapshot = row.resumeSnapshot as {
      draftRetryCount?: number;
    } | null;
    const budget = resolveDraftRetryBudget(snapshot?.draftRetryCount);
    return {
      retryCount: budget.used,
      retryMax: budget.max,
      canRetry: budget.canRetry,
    };
  }
}
