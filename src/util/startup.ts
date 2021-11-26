import { App, ExpressReceiver } from '@slack/bolt';
import { Credentials, Port, RequiredEnvVariables } from '../constant';
import express from 'express';
import { rawBodySaver } from '../middleware';
import { WebClient } from '@slack/web-api';
import { Stripe } from 'stripe';
import { EventHandlerService, SlackWebService, StripeService } from '../services';
import { Dependencies } from '../type';
import { handleEvent, verifyRequest } from '../routes';

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

const setupDependencies = (client: WebClient): Dependencies => {
  const stripe = new Stripe(Credentials.stripe.secretKey,
    <Stripe.StripeConfig> {
      apiVersion: Credentials.stripe.apiVersion,
      typescript: true,
    });

  const stripeService = new StripeService({ stripe, signingSecret: Credentials.stripe.signingSecret });
  const slackWebService = new SlackWebService({ client, channelId: Credentials.slack.channel });
  const eventHandlerService = new EventHandlerService({ slackWebService, stripeService });

  return {
    stripeService,
    slackWebService,
    eventHandlerService,
  };
};

const addRoutes = async (receiver: ExpressReceiver, dependencies: Dependencies) => {
  const { stripeService, eventHandlerService } = dependencies;
  receiver.app.post('/webhook', verifyRequest({ stripeService }), handleEvent({ eventHandlerService }));
};

const start = async () => {
  const { receiver, app } = await initializeApplication();
  const dependencies = await setupDependencies(app.client);
  await addRoutes(receiver, dependencies);

  app.start(Port).then(() => {
      console.log(`App listening on port ${Port}`);
    },
  );
};

export {
  isInitialConfigValid,
  initializeApplication,
  setupDependencies,
  addRoutes,
  start,
};
