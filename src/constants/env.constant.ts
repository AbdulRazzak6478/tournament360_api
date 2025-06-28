import dotSetup from "dotenv"
dotSetup.config();


const getEnv = (key: string, defaultValue?: string): string =>{
    const value = process.env[key] || defaultValue;
    if (value === undefined) {
        {
            throw new Error(`Environment variable ${key} is not set`);
        }
    }
    return value;
};

const NODE_ENV = getEnv("NODE_ENV", "DEV");
const PORT = getEnv("PORT", "4004");
const MONGO_URI_TEST = getEnv("MONGO_URI_TEST");
const MONGO_URI_PROD = getEnv("MONGO_URI_PROD");
const JWT_REFRESH_SECRET = getEnv("JWT_REFRESH_SECRET");
const JWT_ACCESS_SECRET = getEnv("JWT_ACCESS_SECRET");
const APP_ORIGIN = getEnv("APP_ORIGIN");
const EMAIL_USER = getEnv("EMAIL_USER");
const EMAIL_PASS = getEnv("EMAIL_PASS");
const BREVO_API_KEY = getEnv("BREVO_API_KEY");
// just add it
export const env = {
    NODE_ENV,
    PORT,
    MONGO_URI_TEST,
    MONGO_URI_PROD,
    JWT_REFRESH_SECRET,
    JWT_ACCESS_SECRET,
    APP_ORIGIN,
    EMAIL_USER,
    EMAIL_PASS,
    BREVO_API_KEY
}

export default env;