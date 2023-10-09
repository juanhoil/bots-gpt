import * as dotenv from 'dotenv';

export class EnvConfig {
  static config(): void {
    dotenv.config();
  }

  static get(key: string): string | undefined {
    return process.env[key];
  }
}

// Llamamos al método config() al inicio de la aplicación para cargar las variables de entorno
EnvConfig.config();