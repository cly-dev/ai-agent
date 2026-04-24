import {
  Body,
  Controller,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AppClientDsnGuard } from '../../auth/app-client-dsn.guard';
import { UserJwtAuthGuard } from '../../auth/user-jwt-auth.guard';
import { SaveMessageDto } from './dto/save-message.dto';
import { MessageService } from './message.service';

@ApiTags('message')
@Controller('chat/:sessionId/messages')
@UseGuards(UserJwtAuthGuard, AppClientDsnGuard)
@ApiBearerAuth()
@ApiSecurity('app-dsn')
export class MessageController {
  constructor(private readonly service: MessageService) {}

  private userId(req: Request & { user?: { userId?: number } }): number {
    const id = req.user?.userId;
    if (id === undefined) {
      throw new UnauthorizedException('invalid user token');
    }
    return id;
  }

  private appClientId(req: Request): number {
    const id = req.appClient?.id;
    if (id === undefined) {
      throw new UnauthorizedException('missing app client context');
    }
    return id;
  }

  @Post()
  @ApiOperation({ summary: '保存会话消息' })
  @ApiParam({ name: 'sessionId', type: String })
  @ApiResponse({ status: 201, description: '创建成功' })
  create(
    @Req() req: Request & { user?: { userId?: number } },
    @Param('sessionId') sessionId: string,
    @Body() body: SaveMessageDto,
  ) {
    return this.service.create(
      this.userId(req),
      sessionId,
      body,
      this.appClientId(req),
    );
  }
}
