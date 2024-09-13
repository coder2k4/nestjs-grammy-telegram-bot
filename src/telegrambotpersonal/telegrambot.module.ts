import { Module } from '@nestjs/common';
import { TelegrambotServicePersonal } from './telegrambot.service';

@Module({
  providers: [TelegrambotServicePersonal],
})
export class TelegrambotPersonalModule {}
