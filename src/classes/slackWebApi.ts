import { ChatPostMessageArguments, WebClient } from '@slack/web-api';

class SlackWebApi {
  client: WebClient;

  constructor({ client }: { client: WebClient }) {
    this.client = client;
  }

  sendMessage(args: ChatPostMessageArguments) {
    return this.client.chat.postMessage(args);
  }
}

export default SlackWebApi;
