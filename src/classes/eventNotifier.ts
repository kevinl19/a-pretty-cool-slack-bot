import SlackAPI from './slackAPI';
import { StripeEventType } from '../enum';
import { getRandomEmojis } from '../util';
import { Stripe } from 'stripe';
import { StripeEvent } from '../type';

interface NewSubscriptionParams {
  subscription: Stripe.Subscription,
  previous_attributes: { status?: Stripe.Subscription.Status }
}

interface EventNotifierParams {
  slack: SlackAPI;
  channelId: string;
}

class EventNotifier {
  slack: SlackAPI;
  channelId: string;

  constructor({ slack, channelId }: EventNotifierParams) {
    this.slack = slack;
    this.channelId = channelId;
  }

  async handle(event: StripeEvent) {
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
    return this.slack.sendMessage({
      text: `A new user has just registered! ${getRandomEmojis(1)}`,
      channel: this.channelId,
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

    return await this.slack.sendMessage({
      text: `A user has just subscribed to ${validItem.plan.nickname}! ${getRandomEmojis(5)}`,
      channel: this.channelId,
    });

  }

  async handlePaymentSuccess(payment: Stripe.PaymentIntent) {
    if (payment.amount <= 0) {
      return undefined;
    }

    return await this.slack.sendMessage({
      text: `We securing the bag and getting that 🍞. 🤑🤑🤑\nPayment for $${(payment.amount / 100).toFixed(2)} received ${getRandomEmojis(3)}`,
      channel: this.channelId,
    });
  }

}

export default EventNotifier;
