import { ChatPostMessageArguments, WebClient } from '@slack/web-api';

class SlackWebService {
  client: WebClient;

  constructor({ client }: { client: WebClient }) {
    this.client = client;
  }

  sendMessage(args: ChatPostMessageArguments) {
    return this.client.chat.postMessage({ ...args, icon_emoji: ':chart_with_upwards_trend:' });
  }
}

export default SlackWebService;
