import SlackWebService from './slackWebService';
import { StripeEventType } from '../enum';
import { Stripe } from 'stripe';
import { StripeEvent } from '../type';
import { getHappyEmojis } from '../util';
import StripeService from './stripeService';
import moment from 'moment';
import { DebugMode } from '../constant';

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
      if (DebugMode) {
        console.log(JSON.stringify(event, null, 4));
        await this.slackWebService.sendMessage({
          text: JSON.stringify(event, null, 4),
          channel: this.channelId,
        });
      }

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
    await this.slackWebService.sendMessage({
      text: `A user has just registered! ${getHappyEmojis(3)}`,
      channel: this.channelId,
    });

    const stats = await this.getSignupStats();
    if (stats) {
      await this.slackWebService.sendMessage({
        text: stats,
        channel: this.channelId,
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

  async getSignupStats() {
    const twoMonthsAgo = moment().subtract(2, 'months');
    const oneMonthAgo = moment().subtract(1, 'month');
    const twoWeeksAgo = moment().subtract(2, 'week');
    const oneWeekAgo = moment().subtract(1, 'week');
    const twoDaysAgo = moment().subtract(3, 'days');
    const oneDayAgo = moment().subtract(1, 'day');

    const signupsMonth2 = await this.stripeService.getCustomers({ created: { gte: twoMonthsAgo.unix() } });
    const signupsMonth1 = signupsMonth2.filter(({ created }) => moment.unix(created).isSameOrAfter(oneMonthAgo));
    const signupsWeek2 = signupsMonth2.filter(({ created }) => moment.unix(created).isSameOrAfter(twoWeeksAgo));
    const signupsWeek1 = signupsMonth2.filter(({ created }) => moment.unix(created).isSameOrAfter(oneWeekAgo));
    const signupsDay2 = signupsMonth2.filter(({ created }) => moment.unix(created).isSameOrAfter(twoDaysAgo));
    const signupsDay1 = signupsMonth2.filter(({ created }) => moment.unix(created).isSameOrAfter(oneDayAgo));

    const totalMonth1 = signupsMonth1.length;
    const totalWeek1 = signupsWeek1.length;
    const totalDay1 = signupsDay1.length;

    const totalMonth2 = signupsMonth2.length - totalMonth1;
    const totalWeek2 = signupsWeek2.length - totalWeek1;
    const totalDay2 = signupsDay2.length - totalDay1;

    let diffMonth: string | number = totalMonth1 - totalMonth2;
    let diffWeek: string | number = totalWeek1 - totalWeek2;
    let diffDay: string | number = totalDay1 - totalDay2;

    let diffMonthPct: string | number = Math.floor((((totalMonth1 / (signupsMonth2.length - totalMonth1)) - 1) * 100));
    let diffWeekPct: string | number = Math.floor((((totalWeek1 / (signupsWeek2.length - totalWeek1)) - 1) * 100));
    let diffDayPct: string | number = Math.floor((((totalDay1 / (signupsDay2.length - totalDay1)) - 1) * 100));

    diffMonth = diffMonth > 0 ? `+${diffMonth}` : diffMonth;
    diffWeek = diffWeek > 0 ? `+${diffWeek}` : diffWeek;
    diffDay = diffDay > 0 ? `+${diffDay}` : diffDay;

    diffMonthPct = diffMonthPct > 0 ? `+${diffMonthPct}` : diffMonthPct;
    diffWeekPct = diffWeekPct > 0 ? `+${diffWeekPct}` : diffWeekPct;
    diffDayPct = diffDayPct > 0 ? `+${diffDayPct}` : diffDayPct;

    return '' +
      '*================📈 Statistics 📉===============*\n' +
      '*===============================================*\n' +
      '*=* *Time*\t*Current*\t *Previous*   *Change*   *Change %* *=*\n' +
      `*=* *Month*\t_${totalMonth1}_\t _${totalMonth2}_\t    _${diffMonth}_      _${diffMonthPct}%_     *=*\n` +
      `*=* *Week*\t_${totalWeek1}_\t _${totalWeek2}_\t    _${diffWeek}_      _${diffWeekPct}%_     *=*\n` +
      `*=* *Day*\t_${totalDay1}_\t _${totalDay2}_\t    _${diffDay}_      _${diffDayPct}%_     *=*\n` +
      '*===============================================*' +
      '*===============================================*';
  };
}

export default EventHandlerService;
