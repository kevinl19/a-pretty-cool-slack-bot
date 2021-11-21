import dotenv from 'dotenv';
import handleStripeEvent from './routes';
import { App, ExpressReceiver } from '@slack/bolt';
import Stripe from 'stripe';
import StripeEventService from './services/stripeEventService';
import express from 'express';
import rawBodySaver from './middleware/rawBodySaver';

dotenv.config();


const receiver = new ExpressReceiver(
  { signingSecret: process.env.SLACK_SIGNING_SECRET as string },
);
const app = new App(
  { token: process.env.SLACK_BOT_TOKEN as string, receiver },
);

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY as string,
  { apiVersion: process.env.STRIPE_API_VERSION as Stripe.LatestApiVersion },
);

const stripeService = new StripeEventService({
  slack: app.client,
  secret: process.env.STRIPE_SIGNING_SECRET as string,
  stripe,
});


receiver.app.use(
  express.json({
    strict: false,
    verify: rawBodySaver,
  }),
);


receiver.app.post('/webhook', handleStripeEvent({ stripeService: stripeService }));

(
  async () => {
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    const response = await app.start(port);
    response && console.log(`Listening on port ${port}`);
  }
)();
