import { Stripe } from 'stripe';
import moment from 'moment';

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

  async getSignupStatistics() {
    const twoMonthsAgo = moment().subtract(2, 'months');
    const signupsMonth2 = await this.getCustomers({ created: { gte: twoMonthsAgo.unix() } });

    const oneMonthAgo = moment().subtract(1, 'month');
    const twoWeeksAgo = moment().subtract(2, 'week');
    const oneWeekAgo = moment().subtract(1, 'week');
    const twoDaysAgo = moment().subtract(3, 'days');
    const oneDayAgo = moment().subtract(1, 'day');

    const signupsMonth1 = signupsMonth2.filter(({ created }) => moment.unix(created).isSameOrAfter(oneMonthAgo));
    const signupsWeek2 = signupsMonth2.filter(({ created }) => moment.unix(created).isSameOrAfter(twoWeeksAgo));
    const signupsWeek1 = signupsMonth2.filter(({ created }) => moment.unix(created).isSameOrAfter(oneWeekAgo));
    const signupsDay2 = signupsMonth2.filter(({ created }) => moment.unix(created).isSameOrAfter(twoDaysAgo));
    const signupsDay1 = signupsMonth2.filter(({ created }) => moment.unix(created).isSameOrAfter(oneDayAgo));

    const tm2 = signupsMonth2.length;
    const tw2 = signupsWeek2.length;
    const td2 = signupsDay2.length;

    const tm1 = signupsMonth1.length;
    const tw1 = signupsWeek1.length;
    const td1 = signupsDay1.length;

    const m2 = tm2 - tm1;
    const w2 = tw2 - tw1;
    const d2 = td2 - td1;

    const mc = ((tm1 - m2) < 0 ? (tm1 - m2) : `+${(tm1 - m2)}`).toString();
    const wc = ((tw1 - w2) < 0 ? (tw1 - w2) : `+${(tw1 - w2)}`).toString();
    const dc = ((td1 - d2) < 0 ? (td1 - d2) : `+${(td1 - d2)}`).toString();

    const mcp = (`${(tm1 - m2) < 0 ? '-' : '+'}`) + Math.abs((((tm1 / (signupsMonth2.length - tm1)) - 1) * 100)).toFixed(1) + ' % ';
    const wcp = (`${(tw1 - w2) < 0 ? '-' : '+'}`) + Math.abs((((tw1 / (signupsWeek2.length - tw1)) - 1) * 100)).toFixed(1) + ' % ';
    const dcp = (`${(td1 - d2) < 0 ? '-' : '+'}`) + Math.abs((((td1 / (signupsDay2.length - td1)) - 1) * 100)).toFixed(1) + ' %  ';

    return `#             *Current*     *Previous*     *Chng*      *Chng %*\n`
      + `*Month*:   ${tm1}           ${tm2}                ${mc}     ${mcp}\n`
      + `*Week*:     ${tw1}             ${tw2}                  ${wc}     ${wcp}\n`
      + `*Today*:     ${td1}               ${td2}                     ${dc}      ${dcp}\n`;
  };

  validateEvent(payload: string, signature: string | string[]) {
    try {
      return this.stripe.webhooks.constructEvent(payload, signature, this.signingSecret);
    } catch (e: any) {
      return { ...e, message: `Error validating webhook${e.message}` };
    }
  }
}

export default StripeService;
