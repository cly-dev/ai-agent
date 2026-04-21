import { Module } from '@nestjs/common';
import { UserModelConfigController } from './user-model-config.controller';
import { UserModelConfigService } from './user-model-config.service';

@Module({
  controllers: [UserModelConfigController],
  providers: [UserModelConfigService],
  exports: [UserModelConfigService],
})
export class UserModelConfigModule {}
