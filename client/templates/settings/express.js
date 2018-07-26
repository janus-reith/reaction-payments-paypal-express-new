/* eslint camelcase: 0 */
import { Template } from "meteor/templating";
import { AutoForm } from "meteor/aldeed:autoform";
import { i18next } from "/client/api";
import { Packages } from "/lib/collections";
import { NewPaypalPackageConfig } from "../../../lib/collections/schemas";
import "./express.html";

Template.paypalExpressNewSettings.helpers({
  NewPaypalPackageConfig() {
    return NewPaypalPackageConfig;
  },
  packageData() {
    return Packages.findOne({
      name: "payments-paypal-express-new"
    });
  }
});

AutoForm.hooks({
  "paypal-new-update-form-express": {
    onSuccess() {
      return Alerts.toast(i18next.t("admin.settings.saveSuccess"), "success");
    },
    onError(operation, error) {
      return Alerts.toast(`${i18next.t("admin.settings.saveFailed")} ${error}`, "error");
    }
  }
});
