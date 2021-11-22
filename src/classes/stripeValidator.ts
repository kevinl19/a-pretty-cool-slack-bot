import { Stripe } from 'stripe';

class StripeValidator {
  stripe: Stripe;
  signingSecret: string;

  constructor({ stripe, signingSecret }: { stripe: Stripe, signingSecret: string }) {
    this.stripe = stripe;
    this.signingSecret = signingSecret;
  }

  verifyWebhook(payload: string, signature: string | string[]) {
    try {
      return this.stripe.webhooks.constructEvent(payload, signature, this.signingSecret);
    } catch (e: any) {
      return { ...e, message: `Error validating webhook${e.message}` };
    }
  }
}

export default StripeValidator;
