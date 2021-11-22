## Kevin's Sweet Slack Bot

Integrates **Slack** ([Bolt](https://slack.dev/bolt-js/tutorial/getting-started))
with **Stripe** ([Node.js](https://github.com/stripe/stripe-node))

Notifies Slack channel when on Stripe:
1. A customer is created
2. A subscription is activated or reactivated
3. A payment is received

To run:
1. Setup .env from .env.sample
2. `yarn` to install packages 
3. `yarn dev` or `yarn debug` for development or `yarn run` to run on production
