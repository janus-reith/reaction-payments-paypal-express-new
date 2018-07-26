import { Reaction } from "/server/api";

Reaction.registerPackage({
  label: "PayPal",
  name: "payments-paypal-express-new",
  icon: "fa fa-paypal",
  autoEnable: true,
  settings: {
    expressAuthAndCapture: false,
    express: {
      enabled: false,
      support: [
        "Authorize",
        "Capture",
        "Refund"
      ]
    }
  },
  registry: [
    {
      label: "PayPal Express",
      provides: ["paymentSettings"],
      name: "paypal/settings/express",
      icon: "fa fa-paypal",
      template: "paypalExpressNewSettings"
    }, {
      template: "paypalExpressButton",
      label: "Express",
      name: "payment/method/express",
      provides: ["paymentMethod"],
      icon: "fa fa-paypal",
      priority: 1
    }
  ]
});
