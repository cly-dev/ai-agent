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
import { ApprovalRequestService } from '../../core/approval/approval-request.service';
import { ApprovalResumeService } from '../../core/approval/approval-resume.service';
import { resolveDraftRetryBudget } from '../../core/draft-review';
import { ApprovalDecideDto } from './dto/approval-decide.dto';
import { extractWriteDraftPublicFromApprovalRow } from './approval-write-draft.mapper';

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
  async listInbox(
    @Req() req: AuthedRequest,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const rows = await this.approvalRequests.listPendingForApprover({
      appClientId: req.appClient.id,
      approverUserId: this.userId(req),
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
    return {
      items: rows.map((row) => {
        const writeDraft = extractWriteDraftPublicFromApprovalRow(row);
        return {
          id: row.id,
          source: row.source,
          status: row.status,
          title: row.title,
          summary: row.summary,
          workflowId: row.workflowId,
          workflowVersion: row.workflowVersion,
          workflowKey: row.workflow?.workflowKey ?? null,
          workflowName: row.workflow?.name ?? null,
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
          writeDraft,
          previewBlocks: row.previewBlocks,
          pendingWrite: {
            tool: writeDraft.tool.name,
            riskLevel: writeDraft.tool.riskLevel,
          },
          draftReview: this.extractDraftReviewBudget(row),
        };
      }),
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
    const writeDraft = extractWriteDraftPublicFromApprovalRow(row);
    return {
      id: row.id,
      source: row.source,
      status: row.status,
      title: row.title,
      summary: row.summary,
      workflowId: row.workflowId,
      workflowVersion: row.workflowVersion,
      nodeId: row.nodeId,
      sessionId: row.sessionId,
      pageActionRunId: row.pageActionRunId,
      createdAt: row.createdAt,
      decidedAt: row.decidedAt,
      writeDraft,
      previewBlocks: row.previewBlocks,
      pendingWrite: {
        tool: writeDraft.tool.name,
        riskLevel: writeDraft.tool.riskLevel,
      },
      draftReview: this.extractDraftReviewBudget(row),
    };
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
