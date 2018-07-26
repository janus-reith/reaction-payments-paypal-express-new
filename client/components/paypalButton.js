import React, { Component } from "react";
import ReactDOM from 'react-dom';
import scriptLoader from 'react-async-script-loader';
import { Components } from "@reactioncommerce/reaction-components";


class PaypalButton extends Component {

  constructor(props) {
    super(props);

    this.state = {
      showButton: false
    };
  }

  componentDidMount() {
    const {
      isScriptLoaded,
      isScriptLoadSucceed
    } = this.props;

    if (isScriptLoaded && isScriptLoadSucceed) {
      this.setState({ showButton: true });
    }

  }

  componentWillReceiveProps(nextProps) {
    const {
      isScriptLoaded,
      isScriptLoadSucceed,
    } = nextProps;

    const isLoadedButWasntLoadedBefore =
      !this.state.showButton &&
      !this.props.isScriptLoaded &&
      isScriptLoaded;

    if (isLoadedButWasntLoadedBefore) {
      if (isScriptLoadSucceed) {
        this.setState({ showButton: true });
      }
    }
  }

  render() {
    const {
      env,
      commit,
      onAuthorize,
      payment,
      onError,
      onCancel,
    } = this.props;

    const {
      showButton,
    } = this.state;

    if (showButton) {
      const PayPalButton = paypal.Button.driver('react', {React, ReactDOM});

      const buttonStyle = {
        layout: 'vertical',
        size: 'responsive',
        color: 'gold',
        shape: 'rect',
        tagline: false,
        label: 'pay'
      };

      return (
        <div>
          {showButton && <PayPalButton
            env={env}
            style={buttonStyle}
            commit={commit}
            payment={payment}
            onAuthorize={onAuthorize}
            onCancel={onCancel}
            onError={onError}
          />}
        </div>
      );
    }

    return (
      <Components.Loading />
    );

  }
}

export default scriptLoader('https://www.paypalobjects.com/api/checkout.js')(PaypalButton);
