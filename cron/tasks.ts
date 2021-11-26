import { Dependencies } from '../src/type';

const notifyUserSignups = async ({ stripeService, slackWebService }: Dependencies) => {
  console.log('Notifying the Humans on updated stats for user signups...');
  const text = await stripeService.getSignupStatistics();
  const response = text &&
    await slackWebService.sendMessage({
      text: 'User Signups',
      blocks: [{ text: { text, type: 'mrkdwn' }, type: 'section' }],
    });

  !response ? console.error('Failed to notify')
    : console.log('Humans were notified');
};


export { notifyUserSignups };
