# [WIP] reaction-payments-paypal-express-new
A plugin for Reaction Commerce that allows you to process payments with Paypal Express, using the "Smart Buttons" rendered by their checkout.js script.
Still heavily WIP, I take no legal responsibility on how you use this and do not recommend you to use it in production yet.

# Important notice (at least for Shops doing Business in the US, maybe others aswell):
This plugin is currently configured to capture a payment right after a customer authorized it.
Please check if this complies with the laws of the country you are doing business in.
Further options on when to capture payments will probably be implemented in the long term, feel free to submit a PR :)

# Reaction 1.14.0 compatibility
This plugin was currently built alongside release 1.13.1 and may be incompatible with the upcoming version 1.14, as React was updated from 16.2.0 to 16.4.1.
react-async-script-loader, which is used to pull in the paypal script, currently uses an outdated version of hoist-non-react-statics, which is not compatible with React 16.3+
