import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bot, Context, InlineKeyboard, InputFile, Keyboard } from 'grammy';

@Injectable()
export class TelegrambotServiceGroup implements OnModuleInit {
  private bot: Bot<Context>;
  private channelId;
  userStates = new Map<number, string>();
  activeChats = new Map<number, string>(); // Теперь хранит связь между пользователями и ID канала
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

  // Временное хранение данных пользователя
  userData = {};

  mainKeyboard = new Keyboard()
    .text('/start')
    .text('/contacts')
    .row() // новая строка для кнопок
    .text('/calculator')
    .text('/call')
    .row()
    .text('/online_consultation')
    .resized();

  constructor(private configService: ConfigService) {
    this.channelId = this.configService.get<string>('TELEGRAM_GROUP_ID');

    const token = this.configService.get<string>('TELEGRAM_BOT_KEY');
    this.bot = new Bot<Context>(token);

    this.bot.api.setMyCommands([
      { command: 'start', description: 'Запустить бота' },
      { command: 'contacts', description: 'Контакты магазина' },
      { command: 'online_consultation', description: 'Консультация онлайн' },
      { command: 'calculator', description: 'Калькулятор' },
      { command: 'call', description: 'Обратный звонок' },
    ]);
  }

  onModuleInit() {
    this.bot.command('start', async (ctx) => {
      const introductionText = `Привет\\! Я виртуальный помощник компании *Гофроупаковка*\\.\n Мы занимаемся производством и продажей качественной упаковки из гофрокартона\\.\n\n Наш сайт: https://gofro\\-upak\\.ru/ \n\n Чем могу помочь? Выберите одну из команд ниже:\n \\/start \\- \\(пере\\)Запуск виртуального помощника\n \\/contacts \\- Контакты магазина\n \\/online\\_consultation \\- Консультация онлайн\n \\/calculator \\- Калькулятор\n\ \\/call \\- Обратный звонок\n\n`;

      // Сначала отправляем изображение
      await ctx.replyWithPhoto(new InputFile('src/shared/images/logo-new.png'));

      await ctx.reply(introductionText, {
        parse_mode: 'MarkdownV2',
        reply_markup: this.mainKeyboard,
      });
    });

    this.bot.command('contacts', async (ctx) => {
      await ctx.reply(
        '*Гофроупаковка*\n' +
          '_Калужская область, г\\. Обнинск, ул\\. Красных Зорь 34/1_\n\n' +
          '*Телефон*\n' +
          '`+7\\(902\\) 986\\-46\\-16`\n\n' +
          '*Режим работы*\n' +
          'Производство: понедельник\\-воскресенье с 09:00 до 21:00\n' +
          'Офис: понедельник\\-пятница с 09:00 до 18:00\n',
        {
          parse_mode: 'MarkdownV2',
        },
      );

      // Отправляем геолокацию магазина
      await ctx.replyWithLocation(55.108014, 36.623982); // Координаты для примера
    });

    this.bot.command('call', async (ctx) => {
      const keyboard = new Keyboard()
        .requestContact('Отправить контакты')
        .resized()
        .oneTime();

      await ctx.reply('Выберите "Отправить контакты" на клавиатуре.', {
        reply_markup: keyboard,
      });
    });

    this.bot.callbackQuery('yes_send_to_manager', async (ctx) => {
      const userId = ctx.from.id;

      // Проверяем, есть ли данные пользователя
      if (!this.userData[userId]) {
        await ctx.reply('К сожалению, у нас нет данных для отправки.');
        return;
      }

      // Получаем расчетные данные пользователя
      const sessionData = this.userData[userId];
      const volume = this.calculateVolume(sessionData);

      // Собираем данные для отправки менеджеру
      const userFullName =
        ctx.from.first_name + ' ' + (ctx.from.last_name || '');
      const userContact = ctx.from.username
        ? `@${ctx.from.username}`
        : 'Контактное имя отсутствует';
      const messageToManager = `
    🚀 Новый расчет от пользователя:

    👤 Имя: ${userFullName}
    📇 Контакт: ${userContact}

    🏷 Тип изделия: ${this.coefficients.type[sessionData.type].name}
    🏷 Цвет бумаги: ${this.coefficients.color[sessionData.color].name}
    🏷 Тип картона: ${this.coefficients.cardboard[sessionData.cardboard].name}
    
    📏 Высота: ${sessionData.height} мм
    📏 Ширина: ${sessionData.width} мм
    📏 Длина: ${sessionData.length} мм

    📊 Рассчитанная стоимость: ${volume.toFixed(2)} рублей.
  `;

      // Отправляем сообщение менеджеру (замените this.ownerId на ID менеджера)
      await this.bot.api.sendMessage(this.channelId, messageToManager);

      // Уведомляем пользователя, что данные были отправлены
      await ctx.reply(
        'Разрешите доступ к вашему контакту набрав команду /call (или выбрав из меню) - иначе у нас не будет возможности связаться с Вами.',
      );
    });

    //Калькулятор
    {
      this.bot.command('calculator', async (ctx) => {
        await ctx.reply(
          'Выберите вид изделия:',
          this.createInlineKeyboardFromCoefficients('type'),
        );
      });

      this.bot.callbackQuery(/type_(.+)/, async (ctx) => {
        await ctx.answerCallbackQuery();
        const selectedType = ctx.match[1]; // Извлекаем выбор из регулярного выражения
        //ctx.session = { type: selectedType }; // Сохраняем выбор в сессии

        const userId = ctx.from.id;
        this.userData[userId] = { type: selectedType }; // Инициализируем данные пользователя

        const typeData = this.coefficients.type[selectedType];

        await ctx.reply(`Вы выбрали: ${typeData.name}`);

        // Если есть картинка, отправляем её
        if (typeData.picture) {
          await ctx.replyWithPhoto(typeData.picture);
        }

        // Предлагаем выбрать цвет бумаги
        await ctx.reply(
          'Теперь выберите цвет бумаги:',
          this.createInlineKeyboardFromCoefficients('color'),
        );
      });

      this.bot.callbackQuery(/color_(.+)/, async (ctx) => {
        await ctx.answerCallbackQuery();
        const selectedPaper = ctx.match[1];
        const userId = ctx.from.id;
        this.userData[userId].color = selectedPaper;

        const paperData = this.coefficients.color[selectedPaper];

        await ctx.reply(`Вы выбрали цвет бумаги: ${paperData.name}`);

        if (paperData.picture) {
          await ctx.replyWithPhoto(paperData.picture);
        }

        // Предлагаем выбрать тип картона
        await ctx.reply(
          'Теперь выберите тип картона:',
          this.createInlineKeyboardFromCoefficients('cardboard'),
        );
      });

      this.bot.callbackQuery(/cardboard_(.+)/, async (ctx) => {
        await ctx.answerCallbackQuery();
        const selectedCardboard = ctx.match[1];
        const userId = ctx.from.id;
        this.userData[userId].cardboard = selectedCardboard;

        const cardboardData = this.coefficients.cardboard[selectedCardboard];
        await ctx.reply(`Вы выбрали тип картона: ${cardboardData.name}`);

        if (cardboardData.picture) {
          await ctx.replyWithPhoto(cardboardData.picture);
        }

        // Запрос на ввод высоты, ширины и длины
        if (this.userData[userId].type === 'self_assembled') {
          await ctx.replyWithPhoto(
            new InputFile(
              'src/shared/images/self_assebled_cardboard/korob-samosborniy-height-300x300.jpg',
            ),
          );
        } else {
          await ctx.replyWithPhoto(
            new InputFile('src/shared/images/height.jpg'),
          );
        }
        await ctx.reply(
          'Пожалуйста, введите высоту коробки в миллиметрах(мм):',
        );
        this.userStates.set(userId, 'awaiting_height');
      });
    }
    // Начало онлайн-консультации
    this.bot.command('online_consultation', async (ctx) => {
      // Уведомляем оператора о новом запросе на консультацию
      await this.bot.api.sendMessage(
        this.channelId,
        `Новая консультация: пользователь ${ctx.from.first_name} (${ctx.from.id}) запросил консультацию.`,
      );

      // Информируем пользователя
      await ctx.reply('Задайте свой вопрос.');

      // Сохраняем чат
      this.activeChats.set(ctx.from.id, this.channelId);
    });

    this.bot.command('debug_get_id', async (ctx) => {
      const chatId = ctx.chat.id;
      console.log(
        '🚀 ~ TelegrambotServiceGroup ~ this.bot.command ~ chatId:',
        chatId,
      );
      const chatType = ctx.chat.type;
      const message = `ID этого чата: ${chatId}\nТип чата: ${chatType}`;

      await ctx.reply(message);
    });

    // Обработка контактов
    this.bot.on(':contact', async (ctx) => {
      const contact = ctx.message.contact;
      const message = ` Получен контакт от пользователя:\nИмя: ${contact.first_name} ${contact.last_name || ''}\nНомер телефона: ${contact.phone_number}
    `;

      await this.bot.api.sendMessage(this.channelId, message);

      // Отправляем контакт владельцу бота как "карточку контакта"
      await this.bot.api.sendContact(
        this.channelId,
        contact.phone_number,
        contact.first_name,
        {
          last_name: contact.last_name || '', // Добавляем фамилию, если она есть
          vcard: `
                BEGIN:VCARD
                VERSION:3.0
                N:${contact.last_name || ''};${contact.first_name};;;
                FN:${contact.first_name} ${contact.last_name || ''}
                TEL;TYPE=CELL:${contact.phone_number}
                END:VCARD
              `,
        },
      );

      await ctx.reply(
        'Спасибо, мы получили Ваши контакты и передали их менеджеру, скоро он свяжется с вами!',
        {
          reply_markup: this.mainKeyboard,
        },
      );

      const keyboard = new InlineKeyboard()
        .text('Да', 'yes-send-message-to-operator')
        .text('Нет', 'not-send-message-to-operator');

      await ctx.reply('Хотите оставить сообщение для оператора?', {
        reply_markup: keyboard,
      });
    });

    // Обработка нажатия кнопки "Да" для отправки сообщения оператору
    this.bot.callbackQuery('yes-send-message-to-operator', async (ctx) => {
      await ctx.answerCallbackQuery();
      await ctx.reply('Напишите ваш вопрос:');

      // Сохраняем состояние пользователя, чтобы ожидать от него сообщение
      this.userStates.set(ctx.from.id, 'awaiting_message');
    });

    // Обработка нажатия кнопки "Нет"
    this.bot.callbackQuery('not-send-message-to-operator', async (ctx) => {
      await ctx.answerCallbackQuery(); // Закрыть индикацию загрузки после нажатия
      await ctx.reply('Хорошо, если передумаете — напишите в любое время.');
    });

    // Обработка сообщений от пользователя
    this.bot.on('message:text', async (ctx) => {
      const operatorChannelId = this.activeChats.get(ctx.from.id);

      // Если это сообщение от пользователя, пересылаем его оператору
      if (operatorChannelId) {
        await this.bot.api.sendMessage(
          operatorChannelId,
          `Сообщение от пользователя ${ctx.from.first_name} (${ctx.from.id}): ${ctx.message.text}`,
        );
      }

      // Проверяем, что сообщение отправлено оператором (владельцем бота)
      if (
        ctx.chat.id.toString() === this.channelId &&
        ctx.message.reply_to_message
      ) {
        const userIdMatch =
          ctx.message.reply_to_message.text.match(/\((\d+)\)/);
        if (userIdMatch) {
          const userId = parseInt(userIdMatch[1], 10);
          await this.bot.api.sendMessage(
            userId,
            `Сообщение от оператора: ${ctx.message.text}`,
          );
        }
      }
      // Проверяем, что пользователь находится в состоянии ожидания сообщения
      const state = this.userStates.get(ctx.from.id);
      if (state === 'awaiting_message') {
        const userMessage = ctx.message.text;

        // Отправляем сообщение оператору
        await this.bot.api.sendMessage(
          this.channelId,
          `Сообщение для оператора:\n${userMessage}`,
        );
        await ctx.reply('Ваше сообщение отправлено оператору, спасибо!');

        // Убираем пользователя из состояния ожидания
        this.userStates.delete(ctx.from.id);
      }

      // Обработка ввода высоты
      if (state === 'awaiting_height') {
        const height = parseFloat(ctx.message.text);
        if (isNaN(height)) {
          await ctx.reply('Пожалуйста, введите корректное число для высоты.');
        } else {
          this.userData[ctx.from.id].height = height;
          // Запрос на ввод высоты, ширины и длины
          if (this.userData[ctx.from.id].type === 'self_assembled') {
            await ctx.replyWithPhoto(
              new InputFile(
                'src/shared/images/self_assebled_cardboard/korob-samosborniy-width-300x300.jpg',
              ),
            );
          } else {
            await ctx.replyWithPhoto(
              new InputFile('src/shared/images/length.jpg'),
            );
          }
          await ctx.reply('Теперь введите ширину коробки в миллиметрах(мм):');
          this.userStates.set(ctx.from.id, 'awaiting_width');
        }
      }
      // Обработка ввода ширины
      else if (state === 'awaiting_width') {
        const width = parseFloat(ctx.message.text);
        if (isNaN(width)) {
          await ctx.reply('Пожалуйста, введите корректное число для ширины.');
        } else {
          this.userData[ctx.from.id].width = width;
          if (this.userData[ctx.from.id].type === 'self_assembled') {
            await ctx.replyWithPhoto(
              new InputFile(
                'src/shared/images/self_assebled_cardboard/korob-samosborniy-length-300x300.jpg',
              ),
            );
          } else {
            await ctx.replyWithPhoto(
              new InputFile('src/shared/images/width.jpg'),
            );
          }
          await ctx.reply('Теперь введите длину коробки в миллиметрах(мм):');
          this.userStates.set(ctx.from.id, 'awaiting_length');
        }
      }

      // Обработка ввода длины
      else if (state === 'awaiting_length') {
        const length = parseFloat(ctx.message.text);
        if (isNaN(length)) {
          await ctx.reply('Пожалуйста, введите корректное число для длины.');
        } else {
          this.userData[ctx.from.id].length = length;
          this.userStates.delete(ctx.from.id); // Удаляем состояние, чтобы завершить процесс

          // Выполняем расчет и показываем результат
          const cost = this.calculateVolume(this.userData[ctx.from.id]);

          this.userData[ctx.from.id].cost = cost;

          const inlineKeyboard = new InlineKeyboard().text(
            'Отправить данные менеджеру',
            'yes_send_to_manager',
          );

          await ctx.reply(
            `Итоговый расчет: стоимость составляет  = ${cost.toFixed(2)} рублей.`,
            {
              reply_markup: inlineKeyboard,
            },
          );
        }
      }
    });

    // Запускаем бота
    this.bot.start();
  }

  // Генерация инлайн-клавиатуры на основе коэффициентов
  createInlineKeyboardFromCoefficients(type: string) {
    const options = this.coefficients[type];
    const buttons = [];

    for (const key in options) {
      if (options.hasOwnProperty(key)) {
        buttons.push([
          { text: options[key].name, callback_data: `${type}_${key}` },
        ]);
      }
    }

    return {
      reply_markup: {
        inline_keyboard: buttons,
      },
    };
  }

  // Функция для расчета объема
  calculateVolume(sessionData: any) {
    const typeK = this.coefficients.type[sessionData.type].efficiency;
    const paperK = this.coefficients.color[sessionData.color].efficiency;
    const cardboardK =
      this.coefficients.cardboard[sessionData.cardboard].efficiency;

    const height = sessionData.height;
    const width = sessionData.width;
    const length = sessionData.length;

    const area = (((length + width) * 2 + 60) * (height * 2 + 6)) / 1000000; // Деление на 1000000 переводит площадь из кв. мм в кв. метры

    // Финальный расчет с коэффициентами
    const cost = area * typeK * paperK * cardboardK;

    return cost;
  }
}
