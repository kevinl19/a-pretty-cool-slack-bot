require('dotenv').config();


const RequiredEnvVariables = [
  'STRIPE_SECRET_KEY',
  'STRIPE_SIGNING_SECRET',
  'STRIPE_API_VERSION',
  'SLACK_BOT_TOKEN',
  'SLACK_CHANNEL_ID',
  'SLACK_SIGNING_SECRET',
];

interface Credentials {
  stripe: {
    secretKey: string,
    apiVersion: string
    signingSecret: string,
  },
  slack: {
    token: string,
    channel: string
    signingSecret: string,
  }
}

const Credentials: Credentials = {
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY!,
    signingSecret: process.env.STRIPE_SIGNING_SECRET!,
    apiVersion: process.env.STRIPE_API_VERSION!,
  },
  slack: {
    token: process.env.SLACK_BOT_TOKEN!,
    channel: process.env.SLACK_CHANNEL_ID!,
    signingSecret: process.env.SLACK_SIGNING_SECRET!,
  },
};

const Port = process.env.PORT
  ? parseInt(process.env.PORT, 10)
  : 8080;

const DebugMode = process.env.DEBUG == 'true';

const KeywordsEmojiSet = ['joy', 'playful', 'perf', 'cash', 'green', 'money', 'space', 'planet', 'happy', 'grinning', 'wink', 'happy', 'hands', 'hello', 'clap', 'hi', 'yes', 'raised', 'palm'];

export {
  Port,
  Credentials,
  KeywordsEmojiSet,
  DebugMode,
  RequiredEnvVariables,
};
