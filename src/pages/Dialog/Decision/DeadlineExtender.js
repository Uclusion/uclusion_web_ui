import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/styles';
import { Button } from '@material-ui/core'
import { useIntl } from 'react-intl';
import ExpirationSelector from '../../../components/Expiration/ExpirationSelector';
import { manageMarket } from '../../../api/markets';
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton';
import SpinBlockingButtonGroup from '../../../components/SpinBlocking/SpinBlockingButtonGroup';
import { addMarketToStorage } from '../../../contexts/MarketsContext/marketsContextHelper'
import localforage from "localforage"
import { formMarketLink, navigate } from '../../../utils/marketIdPathFunctions'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'

const useStyles = makeStyles(() => ({
  hidden: {
    display: 'none',
  },
  extension: {},
}));

function DeadlineExtender(props) {
  const {
    market, hidden, onCancel
  } = props;
  const [, marketsDispatch] = useContext(MarketsContext);
  const { id: marketId, expiration_minutes: expirationMinutes } = market;
  const classes = useStyles();
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
    <div
      className={hidden ? classes.hidden : classes.extension}
    >
      <ExpirationSelector
        value={extensionPeriod}
        onChange={selectorOnChange}
      />
      <SpinBlockingButtonGroup>
        <Button
          onClick={myCancel}
        >
          {intl.formatMessage({ id: 'deadlineExtenderCancel' })}
        </Button>
        <SpinBlockingButton
          marketId={marketId}
          variant="contained"
          color="primary"
          disabled={extensionPeriod === 0}
          onClick={mySave}
          onSpinStop={onSpinStop}
          hasSpinChecker
        >
          {intl.formatMessage({ id: 'deadlineExtenderSave' })}
        </SpinBlockingButton>
      </SpinBlockingButtonGroup>
    </div>
  );
}

DeadlineExtender.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  market: PropTypes.any.isRequired,
  hidden: PropTypes.bool,
  onCancel: PropTypes.func.isRequired,
};

DeadlineExtender.defaultProps = {
  hidden: false,
};

export default DeadlineExtender;
