import { Module } from '@nestjs/common';
import { LlmModule } from '../llm/llm.module';
import { ImagePanelDemoController } from './image-panel-demo.controller';
import { ImagePanelDemoService } from './image-panel-demo.service';
import { ImagePanelService } from './image-panel.service';

@Module({
  imports: [LlmModule],
  controllers: [ImagePanelDemoController],
  providers: [ImagePanelService, ImagePanelDemoService],
  exports: [ImagePanelService],
})
export class ImagePanelModule {}
