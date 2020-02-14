import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/styles';
import { Button, Checkbox } from '@material-ui/core'
import { useIntl } from 'react-intl';
import ExpirationSelector from '../../../components/Expiration/ExpirationSelector';
import { manageMarket } from '../../../api/markets';
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton';
import SpinBlockingButtonGroup from '../../../components/SpinBlocking/SpinBlockingButtonGroup';
import Typography from '@material-ui/core/Typography'
import { DECISION_TYPE } from '../../../constants/markets'

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
  const { id: marketId, expiration_minutes: expirationMinutes, allow_multi_vote: allowMultiVote,
    market_type: marketType } = market;
  const classes = useStyles();
  const intl = useIntl();
  const [extensionPeriod, setExtensionPeriod] = useState(0);
  const [multiVote, setMultiVote] = useState(allowMultiVote);

  function selectorOnChange(event) {
    const { value } = event.target;
    setExtensionPeriod(parseInt(value, 10));
  }

  function toggleMultiVote() {
    setMultiVote(!multiVote);
  }

  function mySave() {
    let newExpirationMinutes = undefined;
    if (extensionPeriod > 0) {
      newExpirationMinutes = expirationMinutes + extensionPeriod;
    }
    let newAllowMultiVote = undefined;
    if (allowMultiVote !== multiVote) {
      newAllowMultiVote = multiVote;
    }
    return manageMarket(marketId, newExpirationMinutes, newAllowMultiVote);
  }

  function myCancel() {
    setExtensionPeriod(0);
    setMultiVote(allowMultiVote);
  }

  return (
    <div
      className={hidden ? classes.hidden : classes.extension}
    >
      <ExpirationSelector
        value={extensionPeriod}
        onChange={selectorOnChange}
      />
      {marketType === DECISION_TYPE && (
        <>
          <Typography>
            {intl.formatMessage({ id: 'allowMultiVote' })}
            <Checkbox
              id="multiVote"
              name="multiVote"
              checked={multiVote}
              onChange={toggleMultiVote}
            />
          </Typography>
        </>
      )}
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
          disabled={extensionPeriod === 0 && multiVote === allowMultiVote}
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
