import { Module } from '@nestjs/common';
import { TelegrambotServiceGroup } from './telegrambot.service';

@Module({
  providers: [TelegrambotServiceGroup],
})
export class TelegrambotGroupModule {}
