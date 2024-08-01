import React, { useContext, useState } from 'react';
import _ from 'lodash';
import { TextField, Typography } from '@material-ui/core';
import { applyPromoCode, validatePromoCode } from '../../api/users';
import { AccountContext } from '../../contexts/AccountContext/AccountContext';
import { updateAccount } from '../../contexts/AccountContext/accountContextHelper';
import SpinningButton from '../../components/SpinBlocking/SpinningButton';
import { makeStyles, useTheme } from '@material-ui/styles';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'
import WizardStepButtons from '../../components/InboxWizards/WizardStepButtons';
import { useIntl } from 'react-intl';

const useStyles = makeStyles((theme) => {
  return {
    promoInputBox: {
      marginTop: theme.spacing(2),
      marginBottom: theme.spacing(1),
    },
    applyPromoButton: {
      backgroundColor: '#2D9CDB',
      color: 'white',
      '&:hover': {
        backgroundColor: '#2D9CDB'
      },
      textTransform: 'none',
      marginTop: theme.spacing(1),
    },
    promoInput: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
    }

  }
});


function PromoCodeInput(props) {
  const { wizardProps, onSubmit, setSubscriptionInfo } = props;
  const intl = useIntl();
  const [activePromo, setActivePromo] = useState({});
  const [promoBoxValue, setPromoBoxValue] = useState('');
  const [, accountDispatch] = useContext(AccountContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const { valid, code, reused } = activePromo;
  const theme = useTheme();
  const classes = useStyles(theme);

  function promoBoxOnChange(event) {
    const { value } = event.target;
    setPromoBoxValue(value);
  }

  function validatePromo() {
    const trimmed = promoBoxValue.trim();
    validatePromoCode(trimmed)
      .then((promoCheckResult) => {
        if (!promoCheckResult.valid) {
          // set the active promo to the invalid one so that we know it's not going to work
          setActivePromo(promoCheckResult)
          setOperationRunning(false);
        }else{
          return applyPromoCode(trimmed)
            .then((account) => {
              setActivePromo(promoCheckResult);
              // quick add the account to show the new billing info;
              updateAccount(accountDispatch, account);
              setOperationRunning(false);
              // Force refresh from Stripe to pick up discounts if any
              setSubscriptionInfo(undefined);
            })
            .catch((error) => {
              const { status } = error;
              if (status === 409) {
                // let the UI know we've reused the code
                setActivePromo({valid: false, code: trimmed, reused: true});
              }
              setOperationRunning(false);
            });
        }
      });
  }
  const validPromoGiven = !_.isEmpty(activePromo) && valid;
  const invalidPromoGiven = !_.isEmpty(activePromo) && !valid;

  return (
    <div className={classes.promoInputBox}>
      <TextField
        label="Code"
        className={classes.promoInput}
        value={promoBoxValue} onChange={promoBoxOnChange}
        placeholder="Your Code"
      />
      {!wizardProps && (
        <SpinningButton
          className={classes.applyPromoButton}
          disabled={_.isEmpty(promoBoxValue)}
          id="applyPromoButton"
          onClick={validatePromo}
        >
          {intl.formatMessage({id: 'ApplyPromoCode'})}
        </SpinningButton>
      )}
      { invalidPromoGiven && !reused && (
        <Typography>
          Promo Code {code} is not valid
        </Typography>
      )}

      { invalidPromoGiven && reused && (
        <Typography>
          You have already used Promo Code {code}
        </Typography>
      )}
      {validPromoGiven && (
        <Typography>
          Promo Code {code} applied.
        </Typography>
      )}
      {wizardProps && (
        <div style={{marginTop: '3rem'}}>
          <WizardStepButtons
            {...wizardProps}
            onFinish={onSubmit}
            validForm={!_.isEmpty(promoBoxValue)}
            nextLabel="ApplyPromoCode"
            onNext={validatePromo}
          />
        </div>
      )}
    </div>

  )
}

export default PromoCodeInput