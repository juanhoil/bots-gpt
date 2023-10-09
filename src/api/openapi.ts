import fs from 'fs';
import path from 'path';
import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";
import { EnvConfig } from '../config/env.config';
import { downloadFile, rename } from '../utils/file';

const configuration = new Configuration({
  apiKey: EnvConfig.get('OPENAI_API_KEY')// process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const catchErr = (error:any) => {
  let message;
    try {
      if (error.response) {
        message = error.response.data.error.message;
      } else {
        message = error.message;
      }
    } catch (e) {
      console.log(e)
    } finally {
      //await context.sendText(message || 'Error!');
    }
    console.log(message)
    return message
}

export const getTranscription = async (filePath: string, language?: string)  => {
  try {

    const localFilePath = path.resolve(filePath)
    
    const response = await openai.createTranscription(
      fs.createReadStream(localFilePath) as any,
      'whisper-1',
      undefined, undefined, undefined,
      language,
    );

    let text = await processText(response.data.text)

    return text
  } catch (error:any) {
    return catchErr(error)
  }
}
 
export const processText = async (text : string) => {
  if(isTranslator(text)){
    text = await translator(text)
  }
  if(isPaint(text)){
    text = await imagine(text)
  }
  return text
}

export const translator = async (texto: string) => {
  try{
    
    const completion = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: `
      Eres un traductor de idiomas. A continuación, te proporcionaré un texto que especifica que traducir.
      Si no especifico el idioma al que debe ser traducido, por defecto, tradúcelo al inglés.

        texto: ${texto}.
      `,
      //temperature: 0.2,
      //max_tokens: 3500,
    });
    return completion.data.choices[0].text;
  } catch (error:any) {
    return catchErr(error)
  }
}

export const fullChatGPT = async (text: string) => {
  try{
    
    const completion = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: ` ${text}.`,
      //temperature: 0.2,
      //max_tokens: 3500,
    });
    return completion.data.choices[0].text;
  } catch (error:any) {
    return catchErr(error)
  }
}

export const imagine = async (text:string) =>{
  try{
    const res = await openai.createImage({
      prompt: text,
        n: 1,
        size: "512x512",
    });
    const fileUrl = res.data.data[0].url? res.data.data[0].url : ''
    const downloadsPath = path.resolve('./static/photos');
    let filePath = await downloadFile(fileUrl, downloadsPath);
    let newName = filePath+'.png'
    filePath = await rename(filePath, newName)
    return filePath
  } catch (error:any) {
    return catchErr(error)
  }
}

export const isPaint = (texto: string): boolean => {
  const regex = /\Imagi|\bimagi/i;
  return regex.test(texto);
}

export const isTranslator = (texto: string): boolean => {
  const regex = /\bTradu|\btradu/i;
  return regex.test(texto);
}