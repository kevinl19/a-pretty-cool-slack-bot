import SlackWebService from './slackWebService';
import { StripeEventType } from '../enum';
import { Stripe } from 'stripe';
import { StripeEvent } from '../type';
import { getHappyEmojis } from '../util';
import StripeService from './stripeService';

interface NewSubscriptionParams {
  subscription: Stripe.Subscription,
  previous_attributes: { status?: Stripe.Subscription.Status }
}

interface EventHandlerServiceParams {
  slackWebService: SlackWebService;
  stripeService: StripeService;
}

class EventHandlerService {
  slackWebService: SlackWebService;
  stripeService: StripeService;

  constructor({ slackWebService, stripeService }: EventHandlerServiceParams) {
    this.slackWebService = slackWebService;
    this.stripeService = stripeService;
  }

  async handleEvent(event: StripeEvent) {
    try {
      return await this.sendMessageIfValid(event);
    } catch (e) {
      return;
    }
  }

  async sendMessageIfValid({ data, type }: StripeEvent) {
    return (
      {
        [StripeEventType.CustomerCreated]: async () => this.handleCustomerCreated(<Stripe.Customer> data.object),
        [StripeEventType.CustomerSubscriptionUpdated]: async () => this.handleNewSubscription(<NewSubscriptionParams> <unknown> data),
        // [StripeEventType.InvoicePaymentSucceeded]: async () => this.handlePaymentSuccess(<Stripe.PaymentIntent> data.object),
      } as Record<StripeEventType, () => any>
    )[type]();
  }

  async handleCustomerCreated(customer: Stripe.Customer) {
    await this.slackWebService.sendMessage({
      text: `New user registration detected.`,
    });

    const signupStatistics = await this.stripeService.getSignupStatistics();
    if (signupStatistics) {
      await this.slackWebService.sendMessage({
        text: 'User Registration Statistics',
        blocks: [{
          type: 'section',
          text: { text: signupStatistics, type: 'mrkdwn' },
        }],
      });
    }
  }

  async handleNewSubscription({ subscription, previous_attributes }: NewSubscriptionParams) {
    const incompleteStatuses = ['cancelled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid'];
    const wasIncomplete = incompleteStatuses.includes(previous_attributes?.status!);
    const isComplete = subscription.status === 'active';
    if (!isComplete || !wasIncomplete) {
      return undefined;
    }

    const validItem = subscription.items.data.find(({ plan, quantity, price }) => (
      price.active && price.id && quantity! > 0 && plan.amount! > 0));
    if (!validItem) {
      return undefined;
    }

    return await this.slackWebService.sendMessage({
      text: validItem.plan.nickname
        ? `A user has just subscribed to ${validItem.plan.nickname}.`
        : `A user has just signed up for a subscription.`,
    });

  }

  /* Note: A little redundant at the moment.
  async handlePaymentSuccess(payment: Stripe.PaymentIntent) {
    if (payment.amount <= 0) {
      return undefined;
    }
    return await this.slackWebService.sendMessage({
      text: `Payment for $${(payment.amount / 100).toFixed(2)} received! ${getHappyEmojis(2)}`,
    });
  } */
}

export default EventHandlerService;
