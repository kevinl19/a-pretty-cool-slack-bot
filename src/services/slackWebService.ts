import { ChatPostMessageArguments, WebClient } from '@slack/web-api';

interface MessageParams extends Omit<ChatPostMessageArguments, 'channel'> {
  channel?: string,
}

class SlackWebService {
  client: WebClient;
  channelId: string;

  constructor({ client, channelId }: { client: WebClient, channelId: string }) {
    this.client = client;
    this.channelId = channelId;
  }

  sendMessage({ channel: channelOverride, ...args }: MessageParams) {
    return this.client.chat.postMessage({
      ...args,
      channel: !!channelOverride
        ? channelOverride
        : this.channelId,
    });
  }
}

export default SlackWebService;
