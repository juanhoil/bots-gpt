import fs from 'fs';
import path from 'path';
import { OpenAI, ClientOptions } from "openai";

import { EnvConfig } from '../config/env.config';
import { downloadFile, rename } from '../utils/file';
import { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat';

const openai = new OpenAI({
  apiKey: EnvConfig.get('OPENAI_API_KEY')// process.env.OPENAI_API_KEY,
});
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
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(localFilePath),
      model: "whisper-1",
    });

    let text = await processText(transcription.text)

    return text
  } catch (error:any) {
    return catchErr(error)
  }
}
 
export const processText = async (text : string) => {
  const tools: ChatCompletionTool[] = [
    {
      type: "function",
      function: {
        name: "get_action",
        description: "detectar la acción",
        parameters: {
          type: "object",
          properties: {
            generateImage: { type:"boolean", descripcion: "detecta el prompt del mensaje para generar una imagen" },
            translate: { type: "boolean", description: "detecta la accion de traducir" },
          },
          required: ["generateImage", "translate"],
        },
      },
    },
  ];
  const messages: ChatCompletionMessageParam[] = [
    { role: "user", content: text },
  ];

  console.log('messages',messages)
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: messages,
    tools: tools,
    tool_choice: "auto"
  });

  const responseMessage = response.choices[0].message;

  // Step 2: check if the model wanted to call a function
  const toolCalls = responseMessage.tool_calls;

  console.log('detecta la accion')
  console.log(responseMessage, toolCalls)
  console.log('detecta la accion')
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
    const completion = await openai.completions.create({
      model: "gpt-3.5-turbo-instruct",
      prompt: `
      Eres un traductor de idiomas. A continuación, te proporcionaré un texto que especifica que traducir.
      Si no especifico el idioma al que debe ser traducido, por defecto, tradúcelo al inglés.

        texto: ${texto}.
      `,
      max_tokens: 7,
      temperature: 0,
    });
    
    return completion.choices[0].text;
  } catch (error:any) {
    return catchErr(error)
  }
}

export const fullChatGPT = async (text: string) => {
  try{
    
    const completion = await openai.completions.create({
      model: 'text-davinci-003',
      prompt: ` ${text}.`,
      //temperature: 0.2,
      //max_tokens: 3500,
    });
    return completion.choices[0].text;
  } catch (error:any) {
    return catchErr(error)
  }
}

export const mongoObjectId = () => {
  var timestamp = (new Date().getTime() / 1000 | 0).toString(16);
  return timestamp + 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, function() {
      return (Math.random() * 16 | 0).toString(16);
  }).toLowerCase();
};

export const imagine = async (text:string) =>{
  try{
    const image = await openai.images.generate({
      model: "dall-e-3",
      prompt: text,
    });
    const fileUrl = image.data[0].url? image.data[0].url : ''
    const downloadsPath = path.resolve('./static/photos');
    let filePath = await downloadFile(fileUrl, downloadsPath);
    let newName = mongoObjectId()+'.png'
    filePath = await rename(filePath, downloadsPath+'/'+newName)
    
    return './static/photos/'+newName
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

export const createAndUpFileAssistant = async () => {
  const file = await openai.files.create({
    file: fs.createReadStream("mydata.csv"),
    purpose: "assistants",
  });
  const assistant = await openai.beta.assistants.create({
    name: "Data visualizer",
    description: "You are great at creating beautiful data visualizations. You analyze data present in .csv files, understand trends, and come up with data visualizations relevant to those trends. You also share a brief text summary of the trends observed.",
    model: "gpt-4-1106-preview",
    tools: [{"type": "code_interpreter"}],
    file_ids: [file.id]
  });
}