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
  channelId: string;
  slackWebService: SlackWebService;
  stripeService: StripeService;
}

class EventHandlerService {
  channelId: string;
  slackWebService: SlackWebService;
  stripeService: StripeService;

  constructor({ channelId, slackWebService, stripeService }: EventHandlerServiceParams) {
    this.channelId = channelId;
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
        [StripeEventType.InvoicePaymentSucceeded]: async () => this.handlePaymentSuccess(<Stripe.PaymentIntent> data.object),
        [StripeEventType.CustomerSubscriptionUpdated]: async () => this.handleNewSubscription(<NewSubscriptionParams> <unknown> data),
      } as Record<StripeEventType, () => any>
    )[type]();
  }

  async handleCustomerCreated(customer: Stripe.Customer) {
    return this.slackWebService.sendMessage({
      text: `A user has just registered! ${getHappyEmojis(1)}`,
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

    return await this.slackWebService.sendMessage({
      text: validItem.plan.nickname
        ? `A user has just subscribed to ${validItem.plan.nickname}! ${getHappyEmojis(3)}`
        : `A user has just subscribed! ${getHappyEmojis(3)}`,
      channel: this.channelId,
    });

  }

  async handlePaymentSuccess(payment: Stripe.PaymentIntent) {
    if (payment.amount <= 0) {
      return undefined;
    }
    return await this.slackWebService.sendMessage({
      text: `Payment for $${(payment.amount / 100).toFixed(2)} received! ${getHappyEmojis(2)}`,
      channel: this.channelId,
    });
  }
}

export default EventHandlerService;
