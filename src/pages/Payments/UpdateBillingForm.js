// cribbed from stripe example
// https://github.com/stripe/react-stripe-js/blob/90b7992c5232de7312d0fcc226541b62db95017b/examples/hooks/1-Card-Detailed.js
import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { Paper, TextField, Typography } from '@material-ui/core';
import { useIntl } from 'react-intl';
import Grid from '@material-ui/core/Grid';
import SpinningButton from '../../components/SpinBlocking/SpinningButton';
import { makeStyles } from '@material-ui/core/styles';
import { AccountContext } from '../../contexts/AccountContext/AccountContext';
import { getCurrentBillingInfo } from '../../contexts/AccountContext/accountContextHelper';
// this is used to style the Elements Card component
const CARD_OPTIONS = {
  iconStyle: 'solid',

};

// this is the styling for OUR components
const useStyles = makeStyles(theme => ({

  form: {
    width: '100%',
    marginTop: theme.spacing(3),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
    backgroundColor: '#3f6b72',
    color: '#fff',
  },
}));


const EMPTY_DETAILS = { name: '', email: '', phone: '' };

function UpdateBillingForm (props) {

  const { onUpdate } = props;

  const classes = useStyles();
  const stripe = useStripe();
  const elements = useElements();
  const intl = useIntl();

  const [accountState] = useContext(AccountContext);
  const [cardComplete, setCardComplete] = useState(false);
  // we have to manage our own processing state because it's a form submit
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [billingDetails, setBillingDetails] = useState(EMPTY_DETAILS);

  const billingInfo = getCurrentBillingInfo(accountState);
  const validForm = stripe && elements && cardComplete && !error;

  async function onSubmit (e) {
    e.preventDefault();
    if (!stripe || !elements) {
      return; //abort
    }
    if (error) {
      elements.getElement('card').focus();
      return;
    }
    if (cardComplete) {
      setProcessing(true);
    }

    const paymentResult = await stripe.createPaymentMethod(({
      type: 'card',
      card: elements.getElement(CardElement),
      billing_details: billingDetails
    }));

    if (paymentResult.error) {
      setError(paymentResult.error);
      setProcessing(false);
    } else {
      onUpdate(paymentResult.paymentMethod)
    }
  }

/*  function resetForm () {
    setError(null);
    setProcessing(false);
    setBillingDetails(EMPTY_DETAILS);
  }
*/
  function onBillingDetailsChange (name) {
    return (event) => {
      const { target: { value } } = event;
      setBillingDetails({
        ...billingDetails,
        [name]: value,
      });
    };
  }

  function onCardChange (e) {
    // should probably handle error state here too, e.g. invalid numbers
    setCardComplete(e.complete);
  }

  function renderCurrentBillingInfo() {
    if (_.isEmpty(billingInfo)){
      return <React.Fragment/>;
    }

    const cardInfos = billingInfo.map(cardInfo => {
      const {
        brand,
        last4,
        exp_month: expMonth,
        exp_year: expYear
      } = cardInfo;
      return (
        <Typography>
          {brand}: ****-{last4} {expMonth}/{expYear}
        </Typography>
      );
    });

    return (
      <Paper>
        <Typography>
          Current Cards:
        </Typography>
        {cardInfos}
      </Paper>
    )
  }

  return (
    <div>
      {renderCurrentBillingInfo()}
      <form
        className={classes.form}
        autoComplete="off"
        onSubmit={onSubmit}

      >
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <CardElement options={CARD_OPTIONS} onChange={onCardChange}/>
          </Grid>
          <Grid item xs={12}>
            <TextField
              autoComplete="name"
              name="name"
              variant="outlined"
              required
              fullWidth
              id="name"
              autoFocus
              value={billingDetails.name}
              label={intl.formatMessage({ id: 'upgradeFormCardName' })}
              onChange={onBillingDetailsChange('name')}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              variant="outlined"
              required
              fullWidth
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              label={intl.formatMessage({ id: 'upgradeFormCardEmail' })}
              onChange={onBillingDetailsChange('email')}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              variant="outlined"
              required
              fullWidth
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              label={intl.formatMessage({ id: 'upgradeFormCardPhone' })}
              onChange={onBillingDetailsChange('phone')}
            />
          </Grid>

          <SpinningButton
            spinning={processing}
            fullWidth
            variant="contained"
            className={classes.submit}
            type="submit"
            disabled={!validForm}
          >
            {intl.formatMessage({ id: 'upgradeFormUpgradeLabel' })}
          </SpinningButton>
        </Grid>
      </form>
    </div>
  );
}

UpdateBillingForm.propTypes = {
  onUpdate: PropTypes.func,
};

UpdateBillingForm.defaultProps = {
  onUpdate: () => {},
};
export default UpdateBillingForm;