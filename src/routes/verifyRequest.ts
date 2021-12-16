import { NextFunction, Response } from 'express';
import { ModifiedRequest } from '../type';
import { StripeError } from '../enum';
import StripeService from '../services/stripeService';

const verifyRequest = ({ stripeService }: { stripeService: StripeService }) => [
  async ({
    rawBody: payload,
    headers: { 'stripe-signature': signature },
  }: ModifiedRequest, res: Response, next: NextFunction) => {
    if (!signature || !payload) {
      res.status(!payload ? 400 : 401).send(!payload ? 'No payload' : 'No signature');
    }
    const response = stripeService.validateEvent(payload!, signature!);
    if (response && Object.values(StripeError).includes(response.type)) {
      res.status(400).send(response.message);
      return;
    }

    next();
  },
];

export default verifyRequest;
