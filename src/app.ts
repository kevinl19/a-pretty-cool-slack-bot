import { App, ExpressReceiver } from '@slack/bolt';

import { Stripe } from 'stripe';
import express from 'express';
import { rawBodySaver } from './middleware';
import { WebClient } from '@slack/web-api';
import { Credentials, Port } from './constant';
import { EventHandlerService, SlackWebService, StripeService } from './services';
import { RouteDependencies } from './type';
import { handleEvent, verifyRequest } from './routes';

const RequiredEnvVariables = [
  'STRIPE_SECRET_KEY',
  'STRIPE_SIGNING_SECRET',
  'STRIPE_API_VERSION',
  'SLACK_BOT_TOKEN',
  'SLACK_CHANNEL_ID',
  'SLACK_SIGNING_SECRET',
];

const isInitialConfigValid = () => !!process.env && (
  RequiredEnvVariables.reduce((isValid, key) => {
    const isSet = key in process.env && !!process.env[key]!.trim();
    !isSet && console.error(`Required env variable ${key} missing`);

    return !isValid ? false : isSet;
  }, true)
);

const initializeApplication = async () => {
  // Normal routing via Express
  const receiver = new ExpressReceiver({ signingSecret: Credentials.slack.signingSecret });

  // Listener for Slack-specific events
  const app = new App({ receiver, token: Credentials.slack.token });

  // Raw body is used validate Stripe's webhook signature
  receiver.app.use(express.json({ verify: rawBodySaver, strict: false }));

  return { app, receiver };
};

const setupDependencies = async (client: WebClient) => {
  const stripe = new Stripe(Credentials.stripe.secretKey, <Stripe.StripeConfig> {
    apiVersion: Credentials.stripe.apiVersion,
    typescript: true,
  });

  const slackWebService = new SlackWebService({ client });
  const stripeService = new StripeService({ stripe, signingSecret: Credentials.stripe.signingSecret });
  const eventHandlerService = new EventHandlerService({
    channelId: Credentials.slack.channel,
    slackWebService,
    stripeService,
  });

  return { stripeService, eventHandlerService };
};

const addRoutes = async (receiver: ExpressReceiver, dependencies: RouteDependencies) => {
  const { stripeService, eventHandlerService } = dependencies;
  receiver.app.post('/webhook', verifyRequest({ stripeService }), handleEvent({ eventHandlerService }));
};

const start = async () => {
  const { receiver, app } = await initializeApplication();
  const dependencies = await setupDependencies(app.client);
  await addRoutes(receiver, dependencies);

  app.start(Port).then(() =>
    console.log(`App listening on port ${Port}`),
  );
};

if (isInitialConfigValid()) {
  start();
} else {
  console.log('Process exiting');
  process.exit(1);
}
