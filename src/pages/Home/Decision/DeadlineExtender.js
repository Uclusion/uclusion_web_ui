import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/styles';
import { Button } from '@material-ui/core';
import { useIntl } from 'react-intl';
import ExpirationSelector from '../../../components/Expiration/ExpirationSelector';
import { extendMarketExpiration } from '../../../api/markets';
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton';
import SpinBlockingButtonGroup from '../../../components/SpinBlocking/SpinBlockingButtonGroup';

const useStyles = makeStyles(() => ({
  hidden: {
    display: 'none',
  },
  extension: {},
}));

function DeadlineExtender(props) {
  const {
    market, hidden,
  } = props;
  const { id: marketId, expiration_minutes: expirationMinutes } = market;
  const classes = useStyles();
  const intl = useIntl();
  const defaultExtension = 1440;
  const [extensionPeriod, setExtensionPeriod] = useState(defaultExtension);

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
          onClick={mySave}
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
};

DeadlineExtender.defaultProps = {
  hidden: false,
};

export default DeadlineExtender;
