// cribbed from stripe example
// https://github.com/stripe/react-stripe-js/blob/90b7992c5232de7312d0fcc226541b62db95017b/examples/hooks/1-Card-Detailed.js
import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { TextField, Typography } from '@material-ui/core';
import { useIntl } from 'react-intl';
import Grid from '@material-ui/core/Grid';
import SpinningButton from '../../components/SpinBlocking/SpinningButton';
import { makeStyles } from '@material-ui/core/styles';
import { AccountContext } from '../../contexts/AccountContext/AccountContext';
import { getPaymentInfo, updatePaymentInfo } from '../../api/users';
import PhoneField from '../../components/TextFields/PhoneField';
import {
  updateBilling,
  updateAccount,
} from '../../contexts/AccountContext/accountContextHelper';
import clsx from 'clsx';
import Button from '@material-ui/core/Button';
import WizardStepButtons from '../../components/InboxWizards/WizardStepButtons';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';

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
    margin: theme.spacing(3, 2, 2),
    backgroundColor: '#3f6b72',
    color: '#fff',
  },
  action: {
    boxShadow: 'none',
    padding: '4px 16px',
    textTransform: 'none',
    '&:hover': {
      boxShadow: 'none'
    }
  },
  error: {
    color: 'red',
    border: '1px solid red',
    margin: theme.spacing(1,1,1,1),
  },
  actionPrimary: {
    backgroundColor: '#2D9CDB',
    color: 'white',
    '&:hover': {
      backgroundColor: '#2D9CDB'
    }
  },
  cancelButton: {
    margin: theme.spacing(3, 2, 2),
    textTransform: 'capitalize',
    backgroundColor: '#E85757',
    color: 'white',
    '&:hover': {
      backgroundColor: '#E85757'
    }
  },
  buttonBox: {
    display: 'flex',
    width: '100%',
  },
  buttonSpacer: {
    flexGrow: 1,
  },
  cardContainer: {
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
  }
}));

const EMPTY_DETAILS = { name: '', email: '', phone: '' };

function CardInputForm (props) {

  const { onUpdate, onSubmit, submitLabelId, onCancel, wizardProps } = props;

  const classes = useStyles();
  const stripe = useStripe();
  const elements = useElements();
  const intl = useIntl();

  const [, accountDispatch] = useContext(AccountContext);
  const [cardComplete, setCardComplete] = useState(false);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [error, setError] = useState(null);
  const [billingDetails, setBillingDetails] = useState(EMPTY_DETAILS);
  const billingDetailsValid = !_.isEmpty(billingDetails.name)
    && !_.isEmpty(billingDetails.email)
    && !_.isEmpty(billingDetails.phone);

  const validForm = stripe && elements && cardComplete && !error && billingDetailsValid;

  function resetForm () {
    setError(null);
    setBillingDetails(EMPTY_DETAILS);
  }

  function myOnSubmit (e) {
    if (e) {
      e.preventDefault();
    }
    setOperationRunning(true);
    const updateBillingSubmit = (paymentResult) => {
      return updatePaymentInfo(paymentResult.paymentMethod.id)
        .then((upgradedAccount) => {
          updateAccount(accountDispatch, upgradedAccount);
          return getPaymentInfo();
        }).then((info) => {
          updateBilling(accountDispatch, info);
          resetForm();
          setOperationRunning(false);
          onUpdate();
        });
    };

    return stripe.createPaymentMethod(({
      type: 'card',
      card: elements.getElement(CardElement),
      billing_details: billingDetails
    })).then((paymentResult) => {
      // console.log('Payment method creation successful');
      return updateBillingSubmit(paymentResult)
        .then(() => onSubmit());
    }).catch((err) => {
      setError(err.error || err.error_message);
      setOperationRunning(false);
    });

  }

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

  return (
    <div className={classes.root}>
      {error && (
        <div className={classes.error}>
          <Typography>
            {error}
          </Typography>
        </div>
      )}

      <div className={classes.cardContainer}>
      <form
        className={classes.form}
        autoComplete="off"
        onSubmit={myOnSubmit}

      >
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <CardElement options={CARD_OPTIONS} onChange={onCardChange}
                         onReady={(element) => element.focus()}/>
          </Grid>
          <Grid item xs={12}>
            <TextField
              autoComplete="name"
              name="name"
              variant="outlined"
              required
              fullWidth
              id="name"
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
              value={billingDetails.email}
              autoComplete="email"
              label={intl.formatMessage({ id: 'upgradeFormCardEmail' })}
              onChange={onBillingDetailsChange('email')}
            />
          </Grid>
          <Grid item xs={12}>
            <PhoneField
              variant="outlined"
              required
              fullWidth
              id="phone"
              name="phone"
              type="tel"
              value={billingDetails.phone}
              label={intl.formatMessage({ id: 'upgradeFormCardPhone' })}
              onChange={onBillingDetailsChange('phone')}
            />
          </Grid>
          {!wizardProps && (
            <div className={classes.buttonBox}>
              <div>
                <Button
                  className={classes.cancelButton}
                  onClick={onCancel}
                >
                  {intl.formatMessage({ id: 'cancel' })}
                </Button>
              </div>

              <div className={classes.buttonSpacer}>&nbsp;</div>
              <div>
                <SpinningButton
                  variant="contained"
                  className={clsx(
                    classes.submit,
                    classes.action,
                    classes.actionPrimary
                  )}
                  type="submit"
                  disabled={!validForm}
                >
                  {intl.formatMessage({ id: submitLabelId })}
                </SpinningButton>
              </div>
            </div>
          )}
          {wizardProps && (
            <WizardStepButtons
              {...wizardProps}
              onFinish={onSubmit}
              validForm={validForm}
              nextLabel="WizardPaymentInfo"
              onNext={() => myOnSubmit()}
            />
          )}
        </Grid>
      </form>
      </div>
    </div>
  );
}

CardInputForm.propTypes = {
  onUpdate: PropTypes.func,
  onSubmit: PropTypes.func,
  submitLabelId: PropTypes.string,
};

CardInputForm.defaultProps = {
  onUpdate: () => {},
  onSubmit: undefined,
  submitLabelId: 'upgradeFormUpgradeLabel',
};
export default CardInputForm;