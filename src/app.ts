import dotenv from 'dotenv';
import { App, ExpressReceiver } from '@slack/bolt';

import EventNotifier from './classes/eventNotifier';
import { Stripe } from 'stripe';
import express from 'express';
import { rawBodySaver } from './middleware';
import { WebClient } from '@slack/web-api';
import EventValidator from './classes/eventValidator';
import { handleEvent, verifyRequest } from './routes';
import { SlackAPI } from './classes';
import { RouteDependencies } from './type';
import { CREDENTIALS, PORT } from './constant';

dotenv.config();

const initializeApplication = async () => {
  // Normal routing via Express
  const receiver = new ExpressReceiver({ signingSecret: CREDENTIALS.slack.signingSecret });

  // Listener for Slack-specific events
  const app = new App({ receiver, token: CREDENTIALS.slack.token });

  // Raw body is used validate Stripe's webhook signature
  receiver.app.use(express.json({ verify: rawBodySaver, strict: false }));

  return { app, receiver };
};

const setupDependencies = async (client: WebClient) => {
  const stripe = new Stripe(CREDENTIALS.stripe.secretKey, { apiVersion: CREDENTIALS.stripe.apiVersion });
  const slack = new SlackAPI({ client });
  const eventValidator = new EventValidator({ stripe, signingSecret: CREDENTIALS.stripe.signingSecret });
  const eventNotifier = new EventNotifier({ slack, channelId: CREDENTIALS.slack.channel });

  return { eventValidator, eventNotifier };
};

const addRoutes = async (receiver: ExpressReceiver, dependencies: RouteDependencies) => {
  const { eventValidator, eventNotifier } = dependencies;
  receiver.app.post('/webhook', verifyRequest({ eventValidator }), handleEvent({ eventNotifier }));
};

const start = () => async () => {
  const { receiver, app } = await initializeApplication();
  const dependencies = await setupDependencies(app.client);
  await addRoutes(receiver, dependencies);

  app.start(PORT).then(() =>
    console.log(`App listening on port ${PORT}`),
  );
};

start();
