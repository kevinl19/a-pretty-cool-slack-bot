import { Request, Response } from 'express';
import { StripeEvent } from '../type';
import { EventHandlerService } from '../services';

const handleEvent = ({ eventHandlerService }: { eventHandlerService: EventHandlerService }) => [
  async (req: Request, res: Response) => {
    const event = req.body as StripeEvent;
    const eventHandled = await eventHandlerService.handleEvent(event);
    !eventHandled && console.log(`Unsupported event type: ${event.type}`);

    res.send(); // Send 200 to acknowledge successful receipt of request
  },
];

export default handleEvent;
