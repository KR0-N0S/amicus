/**
 * Deklaracje typów dla modułu konfiguracyjnego
 * @author KR0-N0S
 * @date 2025-04-08 17:20:15
 */

declare module 'config' {
    // Deklaracja dla ustawień bazy danych
    export interface DBConfig {
      host: string;
      port: number;
      database: string;
      user: string;
      password: string;
      max?: number;
      idleTimeoutMillis?: number;
      connectionTimeoutMillis?: number;
    }
  
    // Deklaracja dla ustawień JWT
    export interface JWTConfig {
      secret: string;
      expiresIn: string | number;
      refreshTokenSecret?: string;
      refreshTokenExpiresIn?: string | number;
    }
  
    // Deklaracja dla ogólnej konfiguracji aplikacji
    export interface AppConfig {
      port: number;
      nodeEnv: string;
      apiPrefix: string;
      clientUrl: string;
      encryptionKey?: string;
    }
  
    // Eksport wszystkich konfiguracji
    const config: {
      db: DBConfig;
      jwt: JWTConfig;
      app: AppConfig;
    };
  
    export default config;
  }