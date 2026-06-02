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
import { ToolCategoryService } from './tool-category.service';
import { CreateToolCategoryDto } from './dto/create-tool-category.dto';
import { QueryToolCategoryDto } from './dto/query-tool-category.dto';
import { UpdateToolCategoryDto } from './dto/update-tool-category.dto';

@ApiTags('tool-category')
@ApiBearerAuth()
@Controller('tool-category')
export class ToolCategoryController {
  constructor(private readonly service: ToolCategoryService) {}

  @Post()
  @ApiOperation({ summary: '创建工具分类' })
  @ApiResponse({ status: 201, description: '创建成功' })
  create(@Body() body: CreateToolCategoryDto) {
    return this.service.create(body);
  }

  @Get()
  @ApiOperation({ summary: '分页查询工具分类列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findPage(@Query() query: QueryToolCategoryDto) {
    return this.service.findPage(query);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: '按 ID 查询工具分类' })
  @ApiResponse({ status: 200, description: '查询成功' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: '按 ID 更新工具分类' })
  @ApiResponse({ status: 200, description: '更新成功' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateToolCategoryDto,
  ) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: '按 ID 删除工具分类' })
  @ApiResponse({ status: 200, description: '删除成功' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
