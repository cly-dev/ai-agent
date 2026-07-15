import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  RecognizeImagePanelDto,
  StitchImagePanelDto,
} from './dto/stitch-image-panel.dto';
import { ImagePanelDemoService } from './image-panel-demo.service';

/**
 * 开发态拼图 / 看图 demo：不走 /admin 前缀，便于 www HTML 直接调用。
 * 生产默认随 ENABLE_DEV_STATIC 关闭。
 */
@ApiTags('dev-image-panel')
@Controller('dev/image-panel')
export class ImagePanelDemoController {
  constructor(private readonly service: ImagePanelDemoService) {}

  @Post('stitch')
  @ApiOperation({
    summary: 'IMAGE_PANEL/v1 拼图 demo（返回 PNG data URL + 分阶段耗时）',
  })
  stitch(@Body() dto: StitchImagePanelDto) {
    return this.service.stitch(dto);
  }

  @Post('recognize')
  @ApiOperation({
    summary:
      '拼图后用当前启用的 chat 模型做多模态识别（需模型支持 image_url）',
  })
  recognize(@Body() dto: RecognizeImagePanelDto) {
    return this.service.recognize(dto);
  }
}
