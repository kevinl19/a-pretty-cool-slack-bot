import { Response } from 'express';
import { EventNotifier } from '../classes';
import { StripeEvent } from '../type';

const handleEvent = ({ eventNotifier }: { eventNotifier: EventNotifier }) => [
  async ({ body: event }: { body: StripeEvent }, res: Response) => {
    const eventHandled = await eventNotifier.handleEvent(event);
    !eventHandled && console.log(`Unsupported event type: ${event.type}`);

    res.send(); // Send 200 to acknowledge successful receipt of request
  },
];

export default handleEvent;
