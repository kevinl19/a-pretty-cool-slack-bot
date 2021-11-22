import { NextFunction, Response } from 'express';
import { StripeValidator } from '../classes';
import { ModifiedRequest } from '../type';
import { StripeError } from '../enum';

const verifyRequest = ({ stripeValidator }: { stripeValidator: StripeValidator }) => [
  async ({
    rawBody: payload,
    headers: { 'stripe-signature': signature },
  }: ModifiedRequest, res: Response, next: NextFunction) => {
    if (!signature || !payload) {
      res.status(!payload ? 400 : 401).send(!payload ? 'No payload' : 'No signature');
    }
    const response = stripeValidator.verifyWebhook(payload!, signature!);
    if (response && Object.values(StripeError).includes(response.type)) {
      res.status(400).send(response.message);
      return;
    }

    next();
  },
];

export default verifyRequest;
