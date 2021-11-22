import { Request } from 'express';
import { Stripe } from 'stripe';
import { StripeEventType } from './enum';

export interface ModifiedRequest extends Request {
  rawBody?: string,
}

export type StripeObject =
  Stripe.Event
  | Stripe.SubscriptionItem
  | Stripe.BalanceTransaction
  | Stripe.Balance
  | Stripe.Subscription
  | Stripe.Customer
  | Stripe.PaymentIntent
  | Stripe.Account

export interface StripeEvent extends Stripe.Event {
  type: StripeEventType,
  data: {
    object: StripeObject,
    previous_attributes?: { status?: Stripe.Subscription.Status };
  },
}
