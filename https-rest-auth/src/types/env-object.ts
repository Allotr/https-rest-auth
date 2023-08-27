export interface EnvObject extends Record<string, string> {
    GOOGLE_CLIENT_ID: string,
    GOOGLE_CLIENT_SECRET: string,
    GOOGLE_CALLBACK_URL: string,
    MONGO_DB_ENDPOINT: string,
    DB_NAME: string,
    SESSION_SECRET: string,
    REDIRECT_URL: string,
    HTTPS_PORT: string,
    WHITELIST_MODE: string,
    REDIS_ENDPOINT: string,
    REDIS_PORT: string
}