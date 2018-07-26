/* eslint camelcase: 0 */
import { HTTP } from "meteor/http";
import { Meteor } from "meteor/meteor";
import { check } from "meteor/check";
import { Logger } from "/server/api";
import { PayPal } from "../../lib/api";
import { Shops, Cart } from "/lib/collections";

export const methods = {

  "getNewExpressCheckoutToken"(cartId) {
    check(cartId, String);
    this.unblock();
    const cart = Cart.findOne(cartId);
    if (!cart) {
      throw new Meteor.Error("invalid-parameter", "Bad cart ID");
    }
    const shop = Shops.findOne(cart.shopId);
    if (!shop) {
      throw new Meteor.Error("invalid-parameter", "Bad shop ID");
    }
    const amount = Number(cart.getTotal());
    // const shippingAmt = Number(cart.getShippingTotal());
    // const taxAmt = Number(cart.getTaxTotal());
    // const itemAmt = Number(cart.getSubTotal() - cart.getDiscounts());
    const description = `${shop.name} Ref: ${cartId}`;
    const { currency } = shop;
    const options = PayPal.expressCheckoutAccountOptions();
    const authString = `${options.username}:${options.password}`;

    try {
      const post = HTTP.post(`${options.url}/v1/payments/payment`, {
        auth: authString,
        data: {
          intent: "sale",
          payer: {
            payment_method: "paypal"
          },
          transactions: [{
            amount: {
              total: amount,
              currency
            },
            description,
            custom: `${cartId}|${amount}|${currency}`,
            invoice_number: cartId
          }],
          redirect_urls: {
            return_url: options.return_url,
            cancel_url: options.return_url
          }
        }
      });

      return post.data;
    } catch (error) {
      throw new Meteor.Error("checkout-failed", error.message);
    }
  },
  /**
   * Perform the PayPal Express payment application
   * https://developer.paypal.com/docs/classic/api/merchant/DoExpressCheckoutPayment_API_Operation_NVP/
   * @param  {String} paymentID Reference to the payment
   * @param  {String} payerId Reference to the payer
   * @return {Object} results from PayPal normalized
   */
  "confirmNewPaymentAuthorization"(paymentID, payerId) {
    check(paymentID, String);
    check(payerId, String);
    this.unblock();

    const options = PayPal.expressCheckoutAccountOptions();
    let response;

    try {
      const authString = `${options.username}:${options.password}`;
      Logger.info(`url: ${options.url}/v1/payments/payment/${paymentID}/execute`);
      Logger.info(`payerId: ${payerId}`);
      Logger.info(`paymentID: ${paymentID}`);
      response = HTTP.post(`${options.url}/v1/payments/payment/${paymentID}/execute`, {
        auth: authString,
        data: {
          payer_id: payerId
        }
      });
    } catch (error) {
      throw new Meteor.Error("checkout-failed", error.message);
    }
    if (!response) {
      throw new Meteor.Error("bad-response", "Bad response from PayPal");
    }
    return response.data;
  },

  /**
   * Return the settings for the PayPal Express payment Method
   * @return {Object} Express Checkout settings
   */
  "getNewExpressCheckoutSettings"() {
    const settings = PayPal.expressCheckoutAccountOptions();
    const expressCheckoutSettings = {
      merchantId: settings.merchantId,
      mode: settings.mode,
      enabled: settings.enabled
    };
    return expressCheckoutSettings;
  }

};

// export methods to Meteor
Meteor.methods(methods);
