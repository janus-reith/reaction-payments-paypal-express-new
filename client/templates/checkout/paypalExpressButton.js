import { Template } from "meteor/templating";
import PaypalButton from "../../containers/paypalButton";
import "./paypalExpressButton.html";

Template.paypalExpressButton.helpers({
  PaypalButton() {
    return {
      component: PaypalButton
    };
  }
});
