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
import { RouteDependencies } from './type';
import { Credentials, Port } from './constant';

dotenv.config();

const initReceiverAndApp = async () => {
  // Normal routing via Express
  const receiver = new ExpressReceiver({ signingSecret: Credentials.slack.signingSecret });

  // Listener for Slack-specific events
  const app = new App({ receiver, token: Credentials.slack.token });

  // Raw body is used validate Stripe's webhook signature
  receiver.app.use(express.json({ verify: rawBodySaver, strict: false }));

  return { app, receiver };
};

const setupDependencies = async (client: WebClient) => {
  const { slack, stripe } = Credentials;

  const stripeApi = new Stripe(stripe.secretKey, { apiVersion: stripe.apiVersion });
  const slackWebService = new SlackWebApi({ client });
  const stripeEventService = new StripeValidator({ stripe: stripeApi, signingSecret: stripe.signingSecret });
  const eventNotifier = new EventNotifier({ slackWebService, channel: slack.channel });

  return { stripeEventService, eventNotifier };
};

const addRoutes = async (receiver: ExpressReceiver, dependencies: RouteDependencies) => {
  const { stripeEventService, eventNotifier } = dependencies;
  receiver.app.post('/webhook', verifyRequest({ stripeValidator: stripeEventService }), handleEvent({ eventNotifier }));
};

const start = () => async () => {
  const { receiver, app } = await initReceiverAndApp();
  const dependencies = await setupDependencies(app.client);
  await addRoutes(receiver, dependencies);

  app.start(Port).then(() =>
    console.log(`App listening on port ${Port}`),
  );
};

start();
