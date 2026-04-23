import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { MessageModule } from '../message/message.module';
import { ChatController } from './chat.controller';
import { ChatEventsService } from './chat-events.service';
import { ChatService } from './chat.service';

@Module({
  imports: [AuthModule, forwardRef(() => MessageModule)],
  providers: [ChatService, ChatEventsService],
  controllers: [ChatController],
  exports: [ChatService, ChatEventsService],
})
export class ChatModule {}
