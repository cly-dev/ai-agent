import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SessionService } from './session.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { QuerySessionDto } from './dto/query-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';

@ApiTags('session')
@ApiBearerAuth()
@Controller('session')
export class SessionController {
  constructor(private readonly service: SessionService) {}

  @Post('by-app-client/:appClientId')
  @ApiParam({ name: 'appClientId', type: Number, description: 'AppClient ID' })
  @ApiOperation({ summary: '按 AppClient 创建 Session' })
  @ApiResponse({ status: 201, description: '创建成功' })
  create(
    @Param('appClientId', ParseIntPipe) appClientId: number,
    @Body() body: CreateSessionDto,
  ) {
    return this.service.create(appClientId, body);
  }

  @Get('by-app-client/:appClientId')
  @ApiParam({ name: 'appClientId', type: Number, description: 'AppClient ID' })
  @ApiOperation({ summary: '按 AppClient 分页查询 Session 列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findPage(
    @Param('appClientId', ParseIntPipe) appClientId: number,
    @Query() query: QuerySessionDto,
  ) {
    return this.service.findPage(appClientId, query);
  }

  @Patch('by-app-client/:appClientId/:id')
  @ApiParam({ name: 'appClientId', type: Number, description: 'AppClient ID' })
  @ApiParam({ name: 'id', type: String, description: 'Session ID' })
  @ApiOperation({ summary: '按 AppClient + Session ID 更新 Session' })
  @ApiResponse({ status: 200, description: '更新成功' })
  update(
    @Param('appClientId', ParseIntPipe) appClientId: number,
    @Param('id') id: string,
    @Body() body: UpdateSessionDto,
  ) {
    return this.service.update(appClientId, id, body);
  }

  @Delete('by-app-client/:appClientId/:id')
  @ApiParam({ name: 'appClientId', type: Number, description: 'AppClient ID' })
  @ApiParam({ name: 'id', type: String, description: 'Session ID' })
  @ApiOperation({ summary: '按 AppClient + Session ID 删除 Session' })
  @ApiResponse({ status: 200, description: '删除成功' })
  remove(
    @Param('appClientId', ParseIntPipe) appClientId: number,
    @Param('id') id: string,
  ) {
    return this.service.remove(appClientId, id);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: String, description: 'Session ID' })
  @ApiOperation({ summary: '按 Session ID 查询详情' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findOne(@Param('id') id: string) {
    return this.service.findOneById(id);
  }
}
