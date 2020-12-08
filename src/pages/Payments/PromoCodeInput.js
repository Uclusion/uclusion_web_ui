import React, { useContext, useState } from 'react';
import _ from 'lodash';
import { Button, TextField, Typography } from '@material-ui/core';
import { applyPromoCode, validatePromoCode } from '../../api/users';
import { AccountContext } from '../../contexts/AccountContext/AccountContext';
import { updateAccount } from '../../contexts/AccountContext/accountContextHelper';


function PromoCodeInput(props) {
  const [activePromo, setActivePromo] = useState({});
  const [promoBoxValue, setPromoBoxValue] = useState('');
  const [, accountDispatch] = useContext(AccountContext);
  const { valid, code, reused } = activePromo;


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
          setActivePromo(promoCheckResult);
        }else{
          return applyPromoCode(trimmed)
            .then((account) => {
              setActivePromo(promoCheckResult);
              // quick add the account to show the new billing info;
              updateAccount(accountDispatch, account);
            })
            .catch((error) => {
              const { status } = error;
              if (status === 409) {
                // let the UI know we've reused the code
                setActivePromo({valid: false, code: trimmed, reused: true});
              }
            });
        }
      });
  }
  const validPromoGiven = !_.isEmpty(activePromo) && valid;
  const invalidPromoGiven = !_.isEmpty(activePromo) && !valid;

  return (
    <div>
      <TextField value={promoBoxValue} onChange={promoBoxOnChange}/>
      <Button
        disabled={_.isEmpty(promoBoxValue)}
        onClick={validatePromo}
      >
        Apply Promo Code
      </Button>
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
    </div>

  )
}

export default PromoCodeInput