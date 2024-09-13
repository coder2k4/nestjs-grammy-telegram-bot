import { Module } from '@nestjs/common';
import { TelegrambotModule } from './telegrambot/telegrambot.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TelegrambotModule,
    ConfigModule.forRoot({
      isGlobal: true, // Это делает ConfigModule глобальным модулем, чтобы не нужно было импортировать его в каждый модуль
    }),
  ],
})
export class AppModule {}
