import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkg;
import { Message } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import fs from 'fs';
import path from 'path';
import { convertOggToMp3, deleteDownloadFile } from '../utils/file';
import { getTranscription, processText } from '../api/openapi';

export class WhatsappBot {
  private client: any;

  constructor() {
    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    });
    this.configure();
  }

  public start() {
    this.client.initialize();
    this.client.on('ready', () => {
      console.log('Whatsapp bot started!');
    });
  }

  private configure() {
    this.client.on('qr', (qr:any) => {
      //console.log('QR RECEIVED', qr);
      qrcode.generate(qr, {small: true});
    });

    this.client.on('message', async (message: Message) => {
      try {
        //on audio
        if (message.hasMedia && message.type === 'ptt') {
          console.log('voice', message.author);
          
          //downloadFile
          message.reply('Procesando mensaje de voz...');
          const mediaData = await message.downloadMedia();

          let mediaType = mediaData.mimetype.split(';')
          let filePath = path.resolve(`./static/voices/${message.id.id}.${mediaType[0].split('/')[1]}`);

          fs.writeFileSync(filePath, mediaData.data, 'base64');
          if (filePath.endsWith('.ogg')) {
            const newFilePath = filePath.replace('.ogg', '.mp3')
            await convertOggToMp3(filePath, newFilePath)
            deleteDownloadFile(filePath)
            filePath = newFilePath
          }
          //downloadFile

          const text = await getTranscription(filePath ,'es')
          if (text.includes("static/photos")) {
            const media = MessageMedia.fromFilePath(text);
            const chat = await message.getChat();
            chat.sendMessage(media).then(()=>{
              deleteDownloadFile(text)
            });
          }else{
            message.reply(text || 'No seas tímido, dime algo');
          }

          deleteDownloadFile(filePath)
        }
        // on audio

        if (message.body !== '') {
          const text = message.body
          const procesText = await processText(text)
          if (procesText.includes("static/photos")) {
            try{
              const media = MessageMedia.fromFilePath(procesText);
              const chat = await message.getChat();
              chat.sendMessage( media ).then(()=>{
                deleteDownloadFile(procesText)
              });
            }catch(error){
              console.log(error)
            }

            /*
            //igual funciona
            try{
              const media = await MessageMedia.fromUrl('https://oaidalleapiprodscus.blob.core.windows.net/private/org-nNbz1LHr9qccQ5tWibGJetSG/user-Hkkqykw5HDbHjSW0pghlFa6U/img-A8lZ1PHyd91Sq6cxaF2VupDq.png?st=2023-05-31T05%3A18%3A06Z&se=2023-05-31T07%3A18%3A06Z&sp=r&sv=2021-08-06&sr=b&rscd=inline&rsct=image/png&skoid=6aaadede-4fb3-4698-a8f6-684d7786b067&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2023-05-30T20%3A17%3A09Z&ske=2023-05-31T20%3A17%3A09Z&sks=b&skv=2021-08-06&sig=DWOKy5tec3g//bFv7oSbnKqz9t1mXx5E/8CfQjjkLr8%3D');
              this.client.sendMessage(message.from,'media')
            }catch(error){
              console.log(error)
            }*/
            
            /*.then(()=>{
              deleteDownloadFile(procesText)
            });*/
          }else{
            message.reply(procesText || 'algo saio mal!');
          }
       }
      } catch (error) {
        console.log(error);
        message.reply('Algo salió mal');
      }
    });
  }
}