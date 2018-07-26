import React, { Component } from "react";
import PropTypes from "prop-types";
import { Meteor } from "meteor/meteor";
import { Promise } from "meteor/promise";
import { Reaction, Logger } from "/client/api";
import * as Collections from "/lib/collections";
import { registerComponent, composeWithTracker } from "@reactioncommerce/reaction-components";
import PaypalButton from "../components/paypalButton";

class PaypalButtonContainer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      environment: "production"
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

  callWithPromise = () => new Promise((resolve, reject) => {
    Meteor.call("getNewExpressCheckoutToken", this.props.cartId, (error, result) => {
      if (error) reject(error);
      resolve(result);
    });
  })

  buildPaymentMethod = (result, status, mode) => {
    const { packageData } = this.props;

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
      }
    });

    Reaction.Router.go("cart/completed", {}, {
      _id: this.props.cartId
    });
  }

  payment = () => this.callWithPromise().then((response) => response.id)

  onAuthorize = (data) => Meteor.call("confirmNewPaymentAuthorization", data.paymentID, data.payerID, (error, result) => {
    if (error) {
      Logger.warn(error, "Error");
    }

    if (result) {
      this.paymentFinished(result);
      return true;
    }

    return null;
  })

  render() {
    const onError = (error) =>
      Logger.warn(error, "Error");

    const onCancel = (data) =>
      Logger.warn(data, "Cancelled");

    return (
      <div>
        <PaypalButton
          cartId={this.props.cartId}
          packageData={this.props.packageData}
          env={this.state.environment}
          shouldCommit={true}
          onAuthorize={this.onAuthorize}
          payment={this.payment}
          onError={onError}
          onCancel={onCancel}
        />
      </div>
    );
  }
}

/* eslint-disable require-jsdoc */
function composer(props, onData) {
  const handle = Meteor.subscribe("Cart", Meteor.userId());
  if (!handle.ready()) {
    return;
  }
  const cart = Collections.Cart.findOne();

  const packages = Meteor.subscribe("Packages", Reaction.getShopId());
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
/* eslint-enable require-jsdoc */

PaypalButtonContainer.propTypes = {
  cartId: PropTypes.string,
  packageData: PropTypes.object
};

export default composeWithTracker(composer)(PaypalButtonContainer);

registerComponent("PaypalButton", PaypalButtonContainer, [
  composeWithTracker(composer)
]);
