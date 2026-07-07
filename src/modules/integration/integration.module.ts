import { Module } from '@nestjs/common';
import { OutboundHttpModule } from '../../core/outbound-http/outbound-http.module';
import { AuthModule } from '../../auth/auth.module';
import { IntegrationController } from './integration.controller';
import { IntegrationService } from './integration.service';

@Module({
  imports: [OutboundHttpModule, AuthModule],
  providers: [IntegrationService],
  controllers: [IntegrationController],
  exports: [IntegrationService],
})
export class IntegrationModule {}
