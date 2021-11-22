import dotenv from 'dotenv';
import { App, ExpressReceiver } from '@slack/bolt';

import EventNotifier from './classes/eventNotifier';
import { Stripe } from 'stripe';
import express from 'express';
import { rawBodySaver } from './middleware';
import { WebClient } from '@slack/web-api';
import StripeValidator from './classes/stripeValidator';
import { handleEvent, verifyRequest } from './routes';
import { SlackWebApi } from './classes';

dotenv.config();

const credentials = {
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

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const initReceiverAndApp = async () => {
  // Normal routing via Express
  const receiver = new ExpressReceiver({ signingSecret: credentials.slack.signingSecret });

  // Listener for Slack-specific events
  const app = new App({ receiver, token: credentials.slack.token });

  // Raw body is used validate Stripe's webhook signature
  receiver.app.use(express.json({ verify: rawBodySaver, strict: false }));

  return { app, receiver };
};

const setupDependencies = async (client: WebClient) => {
  const { slack, stripe } = credentials;
  const stripeApi = new Stripe(stripe.secretKey, { apiVersion: credentials.stripe.apiVersion });
  const slackWebService = new SlackWebApi({ client });
  const stripeEventService = new StripeValidator({ stripe: stripeApi, signingSecret: stripe.signingSecret });
  const eventNotifier = new EventNotifier({ slackWebService, channel: slack.channel });

  return { stripeEventService, eventNotifier };
};

type RouteDependencies = { stripeEventService: StripeValidator, eventNotifier: EventNotifier };
const addRoutes = async (receiver: ExpressReceiver, dependencies: RouteDependencies) => {
  const { stripeEventService, eventNotifier } = dependencies;
  receiver.app.post('/webhook', verifyRequest({ stripeValidator: stripeEventService }), handleEvent({ eventNotifier }));
};

const start = () => async () => {
  const { receiver, app } = await initReceiverAndApp();
  const dependencies = await setupDependencies(app.client);
  await addRoutes(receiver, dependencies);

  app.start(port).then(() =>
    console.log(`App listening on port ${port}`),
  );
};

start();
