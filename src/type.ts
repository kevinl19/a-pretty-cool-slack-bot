import { Request } from 'express';
import { Stripe } from 'stripe';
import { StripeEventType } from './enum';
import { EventHandlerService, SlackWebService, StripeService } from './services';

interface Dependencies {
  stripeService: StripeService,
  slackWebService: SlackWebService,
  eventHandlerService: EventHandlerService
}

interface ModifiedRequest extends Request {
  rawBody?: string,
}

type StripeObject =
  Stripe.Event
  | Stripe.SubscriptionItem
  | Stripe.BalanceTransaction
  | Stripe.Balance
  | Stripe.Subscription
  | Stripe.Customer
  | Stripe.PaymentIntent
  | Stripe.Account

interface StripeEvent extends Stripe.Event {
  type: StripeEventType,
  data: {
    object: StripeObject,
    previous_attributes?: {
      status?: Stripe.Subscription.Status
    };
  },
}

export {
  Dependencies,
  ModifiedRequest,
  StripeEvent,
  StripeObject,
};
