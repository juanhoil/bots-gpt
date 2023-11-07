import { Telegraf, Context } from 'telegraf';
import { getTranscription, processText } from '../api/openapi';
import { convertOggToMp3, deleteDownloadFile, downloadFile } from '../utils/file';
import path from 'path';

export class TelegramBot {
  private bot: Telegraf<Context>;

  constructor(token: string) {
    this.bot = new Telegraf(token, {
      handlerTimeout: 3 * 60 * 1000,
    });
    this.configure();
  }

  public start() {
    this.bot.launch().then(() => {
      console.log('Telegram bot started!11111');
    }).catch(console.error);
    console.log('Telegram bot started!');
  }

  private configure() {
    this.bot.start(async (ctx) => {
      console.log('start', ctx.from);
      return ctx.reply(`¡Hola ${ctx.from?.first_name}! Charlemos.`);
    });
    
    //this.bot.help((ctx) => ctx.reply('Send me a sticker'));
    
    this.bot.on('text', async (ctx) => {
      const text = ctx.message?.text.trim();
      const id = ctx.from?.id;
      console.log('voice', ctx.from);
      console.log('question', text)
      const message = await processText(text)

      if (message.includes("static/photos")) {
        ctx.replyWithPhoto({ source: message }).then(()=>{
          //deleteDownloadFile(message)
        });
      }else{
        ctx.reply(message || 'algo saio mal!', { reply_to_message_id: ctx.message.message_id });
      }

    });
    
    this.bot.on('voice', async ctx => {
      try {
        const downloadsPath = path.resolve('./static/voices');
        console.log('voice', ctx.from);
        ctx.telegram.sendMessage(ctx.message.chat.id, 'Procesando mensaje de voz...');
        const { href: fileUrl } = await ctx.telegram.getFileLink(ctx.message.voice.file_id);

        //downloadFile
        let filePath = await downloadFile(fileUrl, downloadsPath);
        if (filePath.endsWith('.oga')) {
          const newFilePath = filePath.replace('.oga', '.mp3')
          await convertOggToMp3(filePath, newFilePath)
          deleteDownloadFile(filePath)
          filePath = newFilePath
        }
        //downloadFile

        //'text generate'
        const text = await getTranscription(filePath ,'es')
        
        if (text.includes("static/photos")) {
          ctx.replyWithPhoto({ source: text }).then(()=>{
            deleteDownloadFile(text)
          });
        }else{
          ctx.reply(text || 'No seas tímido, dime algo', { reply_to_message_id: ctx.message.message_id });
        }

        deleteDownloadFile(filePath)
      } catch (error) {
        console.log(error);
        ctx.telegram.sendMessage(ctx.message.chat.id, 'Algo salió mal');
      }
    });

    this.bot.on('photo', async ctx => {
      try {
        const downloadsPath = path.resolve('./static/photos');
        console.log('photo', ctx.message.photo);
        ctx.telegram.sendMessage(ctx.message.chat.id, 'Procesando foto...');
        const arrayPhoto = ctx.message.photo
        const { href: fileUrl } = await ctx.telegram.getFileLink(arrayPhoto[arrayPhoto.length-1].file_id);

        //downloadFile
        
        let filePath = await downloadFile(fileUrl, downloadsPath);
        /*if (filePath.endsWith('.oga')) {
          const newFilePath = filePath.replace('.oga', '.mp3')
          await convertOggToMp3(filePath, newFilePath)
          deleteDownloadFile(filePath)
          filePath = newFilePath
        }*/
        //downloadFile

        //'text generate'
        
        /*const text = await getTranscription(filePath ,'es')
        ctx.reply(text || 'No seas tímido, dime algo', { reply_to_message_id: ctx.message.message_id });
        */
        //deleteDownloadFile(filePath)
      } catch (error) {
        console.log(error);
        ctx.telegram.sendMessage(ctx.message.chat.id, 'Algo salió mal');
      }
    });
    
    this.bot.catch(console.error);
  }
  
}