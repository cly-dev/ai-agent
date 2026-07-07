import { Global, Module } from '@nestjs/common';
import { OutboundHttpService } from './outbound-http.service';

@Global()
@Module({
  providers: [OutboundHttpService],
  exports: [OutboundHttpService],
})
export class OutboundHttpModule {}
