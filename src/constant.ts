import { Stripe } from 'stripe';

const CREDENTIALS = {
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY as string,
    signingSecret: process.env.STRIPE_SIGNING_SECRET as string,
    apiVersion: process.env.STRIPE_API_VERSION as Stripe.LatestApiVersion,
  },
  slack: {
    token: process.env.SLACK_TOKEN as string,
    signingSecret: process.env.SLACK_SIGNING_SECRET as string,
    channel: process.env.SLACK_CHANNEL_ID as string,
  },
};

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const EMOJI_KEYWORDS = ['joy', 'playful', 'perf', 'cash', 'green', 'money', 'space', 'planet', 'happy', 'grinning', 'wink', 'happy', 'hands', 'hello', 'clap', 'hi', 'yes', 'raised', 'palm'];

export {
  PORT,
  CREDENTIALS,
  EMOJI_KEYWORDS,
};
