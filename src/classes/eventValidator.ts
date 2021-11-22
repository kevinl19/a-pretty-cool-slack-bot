import { Stripe } from 'stripe';

class EventValidator {
  stripe: Stripe;
  signingSecret: string;

  constructor({ stripe, signingSecret }: { stripe: Stripe, signingSecret: string }) {
    this.stripe = stripe;
    this.signingSecret = signingSecret;
  }

  validate(payload: string, signature: string | string[]) {
    try {
      return this.stripe.webhooks.constructEvent(payload, signature, this.signingSecret);
    } catch (e: any) {
      return { ...e, message: `Error validating webhook${e.message}` };
    }
  }
}

export default EventValidator;
