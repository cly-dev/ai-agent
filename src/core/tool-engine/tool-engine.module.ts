import { Module } from '@nestjs/common';
import { OutboundHttpModule } from '../outbound-http/outbound-http.module';
import { ToolEngineService } from './tool-engine.service';

@Module({
  imports: [OutboundHttpModule],
  providers: [ToolEngineService],
  exports: [ToolEngineService],
})
export class ToolEngineModule {}
