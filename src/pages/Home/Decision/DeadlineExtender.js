import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/styles';
import ExpirationSelector from '../../../components/DecisionDialogs/ExpirationSelector';
import { Button } from '@material-ui/core';
import { extendMarketExpiration } from '../../../api/markets';
import { useIntl } from 'react-intl';

const useStyles = makeStyles((theme) => ({
  hidden: {
    display: 'none',
  },
  extension: {},
}));

function DeadlineExtender(props) {
  const { market, hidden, onSave, onCancel } = props;
  const { id: marketId, expiration_minutes } = market;
  const classes = useStyles();
  const intl = useIntl();

  const defaultExtension = 1440;
  const [extensionPeriod, setExtensionPeriod] = useState(defaultExtension);

  function selectorOnChange(event) {
    const { value } = event.target;
    setExtensionPeriod(parseInt(value, 10));
  }

  function mySave() {
    const newExpirationMinutes = expiration_minutes + extensionPeriod;
    return extendMarketExpiration(marketId, newExpirationMinutes)
      .then(() => {
        onSave();
      });
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
      <Button
        onClick={myCancel}
      >
        {intl.formatMessage({ id: 'deadlineExtenderCancel'})}
      </Button>
      <Button
        onClick={mySave}
      >
        {intl.formatMessage({ id: 'deadlineExtenderSave' })}
      </Button>
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
  onSave: () => {},
  onCancel: () => {},
};

export default DeadlineExtender