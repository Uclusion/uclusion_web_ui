import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/styles';
import { Button, ButtonGroup } from '@material-ui/core';
import { useIntl } from 'react-intl';
import ExpirationSelector from '../../../components/Expiration/ExpirationSelector';
import { extendMarketExpiration } from '../../../api/markets';
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext';
import SpinBlockingButtonGroup from '../../../components/SpinBlocking/SpinBlockingButtonGroup';

const useStyles = makeStyles(() => ({
  hidden: {
    display: 'none',
  },
  extension: {},
}));

function DeadlineExtender(props) {
  const {
    market, hidden, onSave, onCancel,
  } = props;
  const { id: marketId, expiration_minutes: expirationMinutes } = market;
  const classes = useStyles();
  const intl = useIntl();
  const defaultExtension = 1440;
  const [extensionPeriod, setExtensionPeriod] = useState(defaultExtension);
  const [operationRunning] = useContext(OperationInProgressContext);

  function selectorOnChange(event) {
    const { value } = event.target;
    setExtensionPeriod(parseInt(value, 10));
  }

  function mySave() {
    const newExpirationMinutes = expirationMinutes + extensionPeriod;
    return extendMarketExpiration(marketId, newExpirationMinutes);
  }

  function myCancel() {
    setExtensionPeriod(defaultExtension);
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
          disabled={operationRunning}
        >
          {intl.formatMessage({ id: 'deadlineExtenderCancel' })}
        </Button>
        <SpinBlockingButton
          marketId={marketId}
          variant="contained"
          color="primary"
          onClick={mySave}
          onSpinStop={onSave}
        >
          {intl.formatMessage({ id: 'deadlineExtenderSave' })}
        </SpinBlockingButton>
      </SpinBlockingButtonGroup>
    </div>
  );
}

DeadlineExtender.propTypes = {
  market: PropTypes.any.isRequired,
  hidden: PropTypes.bool,
  onSave: PropTypes.func,
  onCancel: PropTypes.func,
};

DeadlineExtender.defaultProps = {
  hidden: false,
  onSave: () => {
  },
  onCancel: () => {
  },
};

export default DeadlineExtender;
