import dotenv from 'dotenv'
import assert from 'assert'

dotenv.config();

const {
    PORT,
    API_KEY,
    API_DOMAIN,
    PROJECT_ID,
    STORAGE_BUCKET,
    MESSAGING_SENDER_ID,
    APP_ID,
} = process.env;

assert(PORT, 'PORT IS REQUIRED');

const config = {
    port : PORT,
    firebaseConfig: {
        apiKey: API_KEY,
        apiDomain: API_DOMAIN,
        projectId: PROJECT_ID,
        storageBucket: STORAGE_BUCKET,
        messagingSenderId: MESSAGING_SENDER_ID,
        appId: APP_ID,
    }
}

export default config;