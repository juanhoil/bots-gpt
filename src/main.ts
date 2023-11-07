import { TelegramBot } from "./bots/telegram";
import { WhatsappBot } from "./bots/whatsapp"
import { EnvConfig } from "./config/env.config";

const TELEGRAM_BOT_TOKEN = EnvConfig.get('TELEGRAM_BOT_TOKEN')

if (TELEGRAM_BOT_TOKEN){
  const telegramBot = new TelegramBot(TELEGRAM_BOT_TOKEN);
  telegramBot.start();
}

/*const whatsappBot = new WhatsappBot()
whatsappBot.start();]*/