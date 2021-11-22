import { Stripe } from 'stripe';
import { NextFunction, Response } from 'express';
import { StripeValidator } from '../classes';
import { ModifiedRequest } from '../type';

const Errors: Stripe.RawErrorType[] = [
  'card_error',
  'invalid_request_error',
  'api_error',
  'idempotency_error',
  'rate_limit_error',
  'authentication_error',
  'invalid_grant',
];

const verifyRequest = ({ stripeValidator }: { stripeValidator: StripeValidator }) => [
  async ({
    rawBody: payload,
    headers: { 'stripe-signature': signature },
  }: ModifiedRequest, res: Response, next: NextFunction) => {
    if (!signature || !payload) {
      res.status(!payload ? 400 : 401).send(!payload ? 'No payload' : 'No signature');
    }
    const response = stripeValidator.verifyWebhook(payload!, signature!);
    if (response && Errors.includes(response.type)) {
      res.status(400).send(response.message);
      return;
    }

    next();
  },
];

export default verifyRequest;
