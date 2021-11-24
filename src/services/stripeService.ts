import { Stripe } from 'stripe';

class StripeService {
  stripe: Stripe;
  signingSecret: string;

  constructor({ stripe, signingSecret }: { stripe: Stripe, signingSecret: string }) {
    this.stripe = stripe;
    this.signingSecret = signingSecret;
  }

  async getCustomers(params?: Stripe.CustomerListParams): Promise<Stripe.Customer[]> {
    let customers: Stripe.Customer[] = [];

    while (true) {
      const { has_more, data } = await this.stripe.customers.list({
        ...{
          limit: 100,
          starting_after: customers[customers.length - 1]?.id,
        }, ...params,
      });
      if (data && data.length !== 0) {
        customers.push(...data);
      } else if (!has_more) {
        break;
      }
    }

    return customers;
  }

  validateEvent(payload: string, signature: string | string[]) {
    try {
      return this.stripe.webhooks.constructEvent(payload, signature, this.signingSecret);
    } catch (e: any) {
      return { ...e, message: `Error validating webhook${e.message}` };
    }
  }
}

export default StripeService;
