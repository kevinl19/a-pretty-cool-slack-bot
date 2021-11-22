import { Request, Response } from 'express';
import { EventNotifier } from '../classes';
import { StripeEvent } from '../type';

const handleEvent = ({ eventNotifier }: { eventNotifier: EventNotifier }) => [
  async (req: Request, res: Response) => {
    const event = req.body as StripeEvent;
    const eventHandled = await eventNotifier.handle(event);
    !eventHandled && console.log(`Unsupported event type: ${event.type}`);

    res.send(); // Send 200 to acknowledge successful receipt of request
  },
];

export default handleEvent;
