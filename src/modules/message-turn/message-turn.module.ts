import { Module } from '@nestjs/common';
import { MessageTurnController } from './message-turn.controller';
import { MessageTurnService } from './message-turn.service';

@Module({
  controllers: [MessageTurnController],
  providers: [MessageTurnService],
  exports: [MessageTurnService],
})
export class MessageTurnModule {}
