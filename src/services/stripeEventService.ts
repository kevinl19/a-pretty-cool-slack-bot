import { Stripe } from 'stripe';
import { WebClient } from '@slack/web-api';
import handleWebhook from '../util/stripe';
import { SupportedEvents } from '../enum';

interface StripeServiceParams {
  slack: WebClient;
  stripe: Stripe;
  secret: string;
}

class StripeEventService {
  slack: WebClient;
  stripe: Stripe;
  secret: string;

  constructor({ slack, stripe, secret }: StripeServiceParams) {
    this.slack = slack;
    this.stripe = stripe;
    this.secret = secret;
  }

  async handleEvent(event: Stripe.Event): Promise<boolean> {
    try {
      await handleWebhook({
        // @todo: How to do this better?
        slack: this.slack,
        channel: 'C02E957ULP8',
        object: event.data.object,
        eventType: event.type as SupportedEvents,
      });
    } catch (e) {
      console.log(e);
      return false;
    }

    return true;
  }

  async verify(payload: string, signature: string[] | string): Promise<Stripe.Event | Stripe.StripeError> {
    try {
      return this.stripe.webhooks.constructEvent(
        payload, signature, this.secret,
      );
    } catch (error) {
      console.log(error);
      return error as Stripe.StripeError;
    }
  }
}

export default StripeEventService;
