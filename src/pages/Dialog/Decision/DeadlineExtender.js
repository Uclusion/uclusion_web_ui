import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types';
import { Button, CardActions } from '@material-ui/core'
import { FormattedMessage } from 'react-intl'
import ExpirationSelector from '../../../components/Expiration/ExpirationSelector';
import { manageMarket } from '../../../api/markets';
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton';
import { addMarketToStorage } from '../../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { usePlanFormStyles } from '../../../components/AgilePlan';
import { makeStyles } from '@material-ui/core/styles'

const useStyles = makeStyles(
  theme => ({
    actions: {
      margin: theme.spacing(1, 0, 0, 0),
      paddingTop: theme.spacing(5),
    },
  }),
  { name: "Extender" }
);

function DeadlineExtender(props) {
  const {
    market, onCancel
  } = props;
  const [, marketsDispatch] = useContext(MarketsContext);
  const { id: marketId, expiration_minutes: expirationMinutes } = market;
  const classes = usePlanFormStyles();
  const myClasses = useStyles();
  const [extensionPeriod, setExtensionPeriod] = useState(1440);

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
    setExtensionPeriod(1440);
    onCancel();
  }

  return (
    <>
      <ExpirationSelector
        value={extensionPeriod}
        onChange={selectorOnChange}
      />
      <CardActions className={myClasses.actions}>
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
  market: PropTypes.any.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default DeadlineExtender;
