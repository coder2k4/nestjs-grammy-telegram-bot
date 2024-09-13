import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegrambotGroupModule } from './telegrambotgroup/telegrambot.module';

@Module({
  imports: [
    // TelegrambotPersonalModule,
    TelegrambotGroupModule,
    ConfigModule.forRoot({
      isGlobal: true, // Это делает ConfigModule глобальным модулем, чтобы не нужно было импортировать его в каждый модуль
    }),
  ],
})
export class AppModule {}
