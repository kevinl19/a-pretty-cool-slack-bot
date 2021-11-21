import { StripeEventType, SupportedEvents } from '../enum';
import { WebClient } from '@slack/web-api';
import { Stripe } from 'stripe';

interface HandleWebhookParams {
  slack: WebClient,
  object: Stripe.Event.Data.Object,
  eventType: SupportedEvents,
  channel: string,
}

const handleWebhook = ({ slack, object, channel, eventType }: HandleWebhookParams) => (
  (
    {
      [StripeEventType.CustomerCreated]: (
        async () => {
          const text = JSON.stringify(object, null, '\t');
          await slack.chat.postMessage({ text, channel });
        }
      ),

      [StripeEventType.CustomerSubscriptionUpdated]: (
        async () => {
          const text = JSON.stringify(object, null, '\t');
          await slack.chat.postMessage({ text, channel });
        }
      ),

      [StripeEventType.InvoicePaymentSucceeded]: (
        async () => {
          const text = JSON.stringify(object, null, '\t');
          await slack.chat.postMessage({ text, channel });
        }
      ),
    }
  )[eventType]
)();

export default handleWebhook;
