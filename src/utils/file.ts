import { exec } from 'child_process';
import fs from 'fs';
import https from 'https';
import path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

export const deleteDownloadFile = (filePath: string) => {
  fs.unlink(filePath, (err) => {
    if (err) {
      console.log(err)
    };
    // console.log(`${filePath} was deleted`);
  })
}

export const rename = (currentPath:string, newPath:string): Promise<string> => {
  return new Promise((resolve, reject) => {
    fs.rename(currentPath, newPath, (error) => {
      if (error) {
        console.error('Error al cambiar el nombre del archivo:', error);
        reject(error);
      } else {
        console.log('El nombre del archivo se ha cambiado correctamente.');
        resolve(newPath);
      }
    });
  });
};

export function downloadFile(url: string, outputDir: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        const { statusCode } = response;
        const contentType = response.headers['content-type'];

        if (statusCode !== 200) {
          reject(new Error(`Request failed with status code ${statusCode}`));
          return;
        }

        let fileName = (url.split('/').pop() || '').split('?')[0];
        //if(fileName.length > 10) fileName = uuidv4();
        let fileExtension = path.extname(fileName);
        if (fileExtension === '') {
          fileExtension = (contentType || '').split('/')[1];
        }

        const outputPath = path.join(outputDir, fileName);
        const writeStream = fs.createWriteStream(outputPath);
        //console.log(response)
        response.pipe(writeStream);

        writeStream.on('finish', () => {
          writeStream.close(() => {
            resolve(outputPath);
          });
        });
      })
      .on('error', (error) => {
        console.log('****************')
        reject(error);
        console.log('****************')
      });
  });
}

const asyncExec = promisify(exec);

export const convertOggToMp3 = async (inputFile: string, outputFile: string): Promise<string> => {
  try {
    const { stdout, stderr } = await asyncExec(`ffmpeg -loglevel error -i ${inputFile} -c:a libmp3lame -q:a 2 ${outputFile}`);
    // console.log(stdout);

    if (stderr) {
      console.log('****convertOggToMp3****')
      console.error(stderr);
      console.log('****convertOggToMp3****')
    }
    return outputFile
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export const encodeOggWithOpus = async (inputFile: string, outputFile: string) => {
  try {
    const { stdout, stderr } = await asyncExec(`ffmpeg -loglevel error -i ${inputFile} -c:a libopus -b:a 96K ${outputFile}`);
    // console.log(stdout);

    if (stderr) {
      console.error(stderr);
    }
  } catch (err) {
    console.error(err);
  }
}

export const generateBase64Image = (imagePath:string)  => {
  return new Promise((resolve, reject) => {
    fs.readFile(imagePath, (error, data) => {
      if (error) {
        reject(error);
      } else {
        const base64Image = data.toString('base64');
        resolve(base64Image);
      }
    });
  });
}