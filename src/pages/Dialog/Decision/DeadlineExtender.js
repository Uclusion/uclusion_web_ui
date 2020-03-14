import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types';
import { Button, CardActions } from '@material-ui/core'
import { FormattedMessage, useIntl } from 'react-intl'
import ExpirationSelector from '../../../components/Expiration/ExpirationSelector';
import { manageMarket } from '../../../api/markets';
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton';
import SpinBlockingButtonGroup from '../../../components/SpinBlocking/SpinBlockingButtonGroup';
import { addMarketToStorage } from '../../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { usePlanFormStyles } from '../../../components/AgilePlan';

function DeadlineExtender(props) {
  const {
    market, onCancel
  } = props;
  const [, marketsDispatch] = useContext(MarketsContext);
  const { id: marketId, expiration_minutes: expirationMinutes } = market;
  const classes = usePlanFormStyles();
  const intl = useIntl();
  const [extensionPeriod, setExtensionPeriod] = useState(0);

  function selectorOnChange(event) {
    const { value } = event.target;
    setExtensionPeriod(parseInt(value, 10));
  }

  function mySave() {
    let newExpirationMinutes = expirationMinutes + extensionPeriod;
    return manageMarket(marketId, newExpirationMinutes).then((market) => {
      return {
        result: market,
        spinChecker: () => Promise.resolve(true),
      };
    });
  }

  function onSpinStop(market) {
    addMarketToStorage(marketsDispatch, null, market);
    return myCancel();
  }

  function myCancel() {
    setExtensionPeriod(0);
    onCancel();
  }

  return (
    <>
      <ExpirationSelector
        value={extensionPeriod}
        onChange={selectorOnChange}
      />
      <CardActions className={classes.actions}>
        <Button
          onClick={myCancel}
          className={classes.actionSecondary}
          color="secondary"
          variant="contained"
        >
          <FormattedMessage
            id="marketAddCancelLabel"
          />
        </Button>
        <SpinBlockingButton
          id="save"
          marketId={marketId}
          variant="contained"
          color="primary"
          className={classes.actionPrimary}
          disabled={extensionPeriod === 0}
          onClick={mySave}
          onSpinStop={onSpinStop}
          hasSpinChecker
        >
          <FormattedMessage
            id="agilePlanFormSaveLabel"
          />
        </SpinBlockingButton>
      </CardActions>
    </>
  );
}

DeadlineExtender.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  market: PropTypes.any.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default DeadlineExtender;
