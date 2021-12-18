import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types';
import { CardActions } from '@material-ui/core'
import { FormattedMessage } from 'react-intl'
import ExpirationSelector from '../../../components/Expiration/ExpirationSelector';
import { manageMarket } from '../../../api/markets';
import { addMarketToStorage } from '../../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { Clear, Snooze } from '@material-ui/icons'
import SpinningIconLabelButton from '../../../components/Buttons/SpinningIconLabelButton'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'

function DeadlineExtender(props) {
  const {
    market, onCancel
  } = props;
  const [, marketsDispatch] = useContext(MarketsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const { id: marketId, expiration_minutes: expirationMinutes } = market;
  const [extensionPeriod, setExtensionPeriod] = useState(1440);

  function selectorOnChange(event) {
    const { value } = event.target;
    setExtensionPeriod(parseInt(value, 10));
  }

  function mySave() {
    let newExpirationMinutes = expirationMinutes + extensionPeriod;
    return manageMarket(marketId, newExpirationMinutes).then((market) => {
      setOperationRunning(false);
      onSpinStop(market);
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
      <CardActions style={{paddingTop: '1rem'}}>
        <SpinningIconLabelButton onClick={myCancel} doSpin={false} icon={Clear}>
          <FormattedMessage id="marketAddCancelLabel"/>
        </SpinningIconLabelButton>
        <SpinningIconLabelButton onClick={mySave} icon={Snooze} id="decisionDialogsExtendDeadlineButton">
          <FormattedMessage id="decisionDialogsExtendDeadline"/>
        </SpinningIconLabelButton>
      </CardActions>
    </>
  );
}

DeadlineExtender.propTypes = {
  market: PropTypes.any.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default DeadlineExtender;
