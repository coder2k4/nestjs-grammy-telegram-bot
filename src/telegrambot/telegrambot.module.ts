import { Module } from '@nestjs/common';
import { TelegrambotService } from './telegrambot.service';

@Module({
  providers: [TelegrambotService],
})
export class TelegrambotModule {}
