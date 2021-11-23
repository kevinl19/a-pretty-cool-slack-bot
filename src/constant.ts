require('dotenv').config();

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

const KeywordsEmojiSet = ['joy', 'playful', 'perf', 'cash', 'green', 'money', 'space', 'planet', 'happy', 'grinning', 'wink', 'happy', 'hands', 'hello', 'clap', 'hi', 'yes', 'raised', 'palm'];

export {
  Port,
  Credentials,
  KeywordsEmojiSet,
};
