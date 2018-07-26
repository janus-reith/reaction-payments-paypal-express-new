import React, { Component } from "react";
import { compose, withProps } from "recompose";
import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { Promise } from 'meteor/promise';
import { Reaction, i18next, Logger } from "/client/api";
import { Countries } from "/client/collections";
import * as Collections from "/lib/collections";
import { registerComponent, composeWithTracker } from "@reactioncommerce/reaction-components";
import PaypalButton from "../components/paypalButton";

class PaypalButtonContainer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      environment: "production",
    };
  }

  componentDidMount() {
    Meteor.call("getNewExpressCheckoutSettings", (error, settings) => {
      if (!error) {
        this.setState({
          environment: settings.mode
        });
      }
    });
  }

  callWithPromise = () => {
    return new Promise((resolve, reject) => {
      Meteor.call("getNewExpressCheckoutToken", this.props.cartId, (error, result) => {
        if (error) reject(error);
        resolve(result);
      });
    });
  }

  buildPaymentMethod = (result, status, mode) => {
    const packageData = this.props.packageData;

    const paymentMethod = {
      processor: "PaypalExpress",
      paymentPackageId: packageData._id,
      paymentSettingsKey: packageData.registry[0].settingsKey,
      method: "credit",
      transactionId: result.id,
      amount: parseFloat(result.transactions[0].amount.total, 10),
      status,
      mode,
      createdAt: new Date(result.create_time),
      updatedAt: new Date(result.create_time),
      transactions: [result]
    };
    return paymentMethod;
  }

  paymentFinished = (result) => {
    console.log(result);
    let status;
    let mode = "authorize";
    // Normalize status depending on results
    if (result.state === "Pending") {
      status = "created";
    } else if (result.state === "approved") { // If we set capture at auth this will be completed
      // status = "completed";
      status = "captured";
      mode = "capture";
    } else {
      status = result.state;
    }
    const paymentMethod = this.buildPaymentMethod(result, status, mode);

    Meteor.call("cart/submitPayment", paymentMethod, (payError, payResult) => {
      if (!payResult && payError) {
        Logger.warn(payError, "Error received during submitting Payment via Paypal");
        showError(payError);
        Session.set("guestCheckoutFlow", true);
      }
    });

    Reaction.Router.go("cart/completed", {}, {
      _id: this.props.cartId
    });
  }

  payment = () => {
    return this.callWithPromise().then(function (response) {
      console.log(response.id);
      return response.id;
    });
  }

  onAuthorize = (data, actions) => {
      return Meteor.call("confirmNewPaymentAuthorization", data.paymentID, data.payerID, (error, result) => {
        if (error) {
          console.log("error: " + error);
          return null;
        }

        if (result) {
          console.log("result: " + result);
          this.paymentFinished(result);
        }
      });
      }

  render() {
    console.log(this.props.expressCheckoutSettings);

  const onError = (error) =>
    console.log('Erroneous payment OR failed to load script!', error);

  const onCancel = (data) =>
    console.log('Cancelled payment!', data);

  return (
    <div>
      <PaypalButton
        cartId={this.props.cartId}
        packageData={this.props.packageData}
        env={this.state.environment}
        commit={true}
        onAuthorize={this.onAuthorize}
        payment={this.payment}
        onError={onError}
        onCancel={onCancel}
      />
    </div>
  );
}
}

function composer(props, onData) {
  const handle = Meteor.subscribe("Cart", Meteor.userId());
  if (!handle.ready()) {
    return;
  }
  const cart = Collections.Cart.findOne();

  const packages =  Meteor.subscribe("Packages", Reaction.getShopId());
  if (!packages.ready()) {
    return;
  }

  const packageData = Collections.Packages.findOne({
    name: "payments-paypal-express-new",
    shopId: Reaction.getShopId()
  });

  let expressCheckoutSettings = {};

  Meteor.call("getNewExpressCheckoutSettings", (error, settings) => {
    if (!error) {
      expressCheckoutSettings = settings;
    }

  });

  onData(null, {
    cartId: cart._id,
    expressCheckoutSettings,
    packageData
  });
}

export default composeWithTracker(composer)(PaypalButtonContainer);

registerComponent("PaypalButton", PaypalButtonContainer, [
  composeWithTracker(composer)
]);
