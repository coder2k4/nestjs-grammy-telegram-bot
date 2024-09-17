# Гофроупаковка Telegram Бот

Этот бот предназначен для компании "Гофроупаковка", специализирующейся на производстве и продаже упаковки из гофрокартона. Бот предоставляет информацию о компании, позволяет рассчитать стоимость упаковки и обеспечивает связь с менеджерами.

## Функциональность

Бот поддерживает следующие команды:

- `/start` - Запуск бота и отображение главного меню
- `/contacts` - Отображение контактной информации компании
- `/online_consultation` - Запрос онлайн-консультации с менеджером
- `/calculator` - Калькулятор для расчета стоимости упаковки
- `/call` - Запрос обратного звонка

## Установка и запуск

### Предварительные требования

- Node.js (версия 14 или выше)
- npm (обычно устанавливается вместе с Node.js)
- PM2 (для управления процессом на сервере)

### Шаги по установке

1. Клонируйте репозиторий:

   ```
   git clone https://github.com/coder2k4/nestjs-grammy-telegram-bot.git
   cd nestjs-grammy-telegram-bot
   ```

2. Установите зависимости:

   ```
   npm install
   ```

3. Создайте файл `.env` в корневой директории проекта и добавьте следующие переменные окружения:

   ```
   TELEGRAM_BOT_KEY="ваш_токен_бота"
   TELEGRAM_OWNER_ID="ID_владельца_бота"
   TELEGRAM_GROUP_ID="ID_группы_для_консультаций"
   ```

4. Запустите бота с помощью PM2:

   ```
   pm2 start npm --name "gofro-bot" -- start
   ```

5. Чтобы бот автоматически перезапускался при изменениях, используйте:

   ```
   pm2 start npm --name "gofro-bot" -- start --watch
   ```

6. Для мониторинга работы бота используйте:
   ```
   pm2 monit
   ```

## Управление ботом с помощью PM2

PM2 - это менеджер процессов для Node.js приложений, который помогает держать приложения в рабочем состоянии и управлять ими в производственной среде.

### Основные команды PM2:

1. Запуск бота:

   ```
   pm2 start npm --name "gofro-bot" -- start
   ```

2. Запуск бота в режиме наблюдения за изменениями (автоматический перезапуск при изменении файлов):

   ```
   pm2 start npm --name "gofro-bot" -- start --watch
   ```

3. Остановка бота:

   ```
   pm2 stop gofro-bot
   ```

4. Перезапуск бота:

   ```
   pm2 restart gofro-bot
   ```

5. Просмотр списка процессов:

   ```
   pm2 list
   ```

6. Просмотр логов бота:

   ```
   pm2 logs gofro-bot
   ```

7. Просмотр детальной информации о процессе:

   ```
   pm2 show gofro-bot
   ```

8. Мониторинг процессов в реальном времени:

   ```
   pm2 monit
   ```

9. Удаление процесса из списка PM2:

   ```
   pm2 delete gofro-bot
   ```

10. Сохранение текущего списка процессов (для автоматического восстановления после перезагрузки системы):

    ```
    pm2 save
    ```

11. Настройка автозапуска PM2 при старте системы:
    ```
    pm2 startup
    ```

Примечание: Замените "gofro-bot" на фактическое имя, которое вы дали процессу при запуске, если оно отличается.

Для получения дополнительной информации о PM2 и его возможностях, посетите [официальную документацию PM2](https://pm2.keymetrics.io/docs/usage/quick-start/).

## Разработка

Для запуска бота в режиме разработки используйте:

```
npm run start:dev
```

## Контакты

При возникновении вопросов или проблем, пожалуйста, создайте issue в этом репозитории или свяжитесь с разработчиками напрямую.

## Примеры работы бота

<img src="tgbot.gif" alt="Гофроупаковка Logo" width="500"/>

```bash
📦src
 ┣ 📂shared - папка для картинок
 ┃ ┗ 📂images
 ┃ ┃ ┣ 📂self_assebled_cardboard
 ┃ ┃ ┃ ┣ 📜korob-samosborniy-height-300x300.jpg
 ┃ ┃ ┃ ┣ 📜korob-samosborniy-length-300x300.jpg
 ┃ ┃ ┃ ┗ 📜korob-samosborniy-width-300x300.jpg
 ┃ ┃ ┣ 📜gofro-upak_logo-268x50.png
 ┃ ┃ ┣ 📜gofroupakovka.png
 ┃ ┃ ┣ 📜height.jpg
 ┃ ┃ ┣ 📜length.jpg
 ┃ ┃ ┣ 📜logo-new.png
 ┃ ┃ ┣ 📜logo_white1.png
 ┃ ┃ ┗ 📜width.jpg
 ┣ 📂telegrambotgroup - версия для группы
 ┃ ┣ 📜telegrambot.module.ts
 ┃ ┗ 📜telegrambot.service.ts - основной код бота
 ┣ 📂telegrambotpersonal - версия для персональной переписки (old)
 ┃ ┣ 📜telegrambot.module.ts
 ┃ ┗ 📜telegrambot.service.ts
 ┣ 📜app.module.ts
 ┗ 📜main.ts
```

### Настройка коэффициентов для расчета калькулятора

```javascript
// Для калькулятора
coefficients = {
  type: {
    self_assembled: {
      name: 'самосборный',
      efficiency: 1.3,
      picture: undefined,
    },
    four_valve: {
      name: 'четырехклапанный',
      efficiency: 1.1,
      picture: undefined,
    },
  },
  color: {
    white: {
      name: 'белая',
      efficiency: 1.2,
      picture: undefined,
    },
    gray: {
      name: 'серая',
      efficiency: 1.0,
      picture: undefined,
    },
  },
  cardboard: {
    Т22: {
      name: 'Т22',
      efficiency: 31.5,
      picture: undefined,
    },
    Т23: {
      name: 'Т23',
      efficiency: 34.86,
      picture: undefined,
    },
  },
};
```
