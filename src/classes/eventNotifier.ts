import SlackWebApi from './slackWebApi';
import { StripeEventType } from '../enum';
import { getRandomEmojis } from '../util';
import { Stripe } from 'stripe';
import { StripeEvent } from '../type';

interface NewSubscriptionParams {
  subscription: Stripe.Subscription,
  previous_attributes: { status?: Stripe.Subscription.Status }
}

interface EventNotifierParams {
  slackWebService: SlackWebApi;
  channel: string;
}

class EventNotifier {
  slackService: SlackWebApi;
  channel: string;

  constructor({ slackWebService, channel }: EventNotifierParams) {
    this.slackService = slackWebService;
    this.channel = channel;
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
        [StripeEventType.InvoicePaymentSucceeded]: async () => this.handlePaymentSuccess(<Stripe.PaymentIntent> data.object),
        [StripeEventType.CustomerSubscriptionUpdated]: async () => this.handleNewSubscription(<NewSubscriptionParams> <unknown> data),
      } as Record<StripeEventType, () => any>
    )[type]();
  }

  async handleCustomerCreated(customer: Stripe.Customer) {
    return this.slackService.sendMessage({
      text: `A new user has just registered! ${getRandomEmojis(1)}`,
      channel: this.channel,
    });
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

    return await this.slackService.sendMessage({
      text: `A user has just subscribed to ${validItem.plan.nickname}! ${getRandomEmojis(5)}`,
      channel: this.channel,
    });

  }

  async handlePaymentSuccess(payment: Stripe.PaymentIntent) {
    if (payment.amount <= 0) {
      return undefined;
    }

    return await this.slackService.sendMessage({
      text: `We securing the bag and getting that 🍞. 🤑🤑🤑\nPayment for $${(payment.amount / 100).toFixed(2)} received ${getRandomEmojis(3)}`,
      channel: this.channel,
    });
  }

}

export default EventNotifier;
