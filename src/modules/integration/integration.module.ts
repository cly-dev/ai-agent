import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { IntegrationController } from './integration.controller';
import { IntegrationService } from './integration.service';

@Module({
  imports: [AuthModule],
  providers: [IntegrationService],
  controllers: [IntegrationController],
  exports: [IntegrationService],
})
export class IntegrationModule {}
