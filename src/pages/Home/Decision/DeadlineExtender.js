import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/styles';
import ExpirationSelector from '../../../components/DecisionDialogs/ExpirationSelector';
import { Card } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  hidden: {
    display: 'none',
  },
  extension: {},
}));

function DeadlineExtender(props) {
  const { market, hidden, onSave, onCancel } = props;
  const { id, expiration_minutes } = props;
  const classes = useStyles();

  const [extensionPeriod, setExtensionPeriod] = useState(1440);

  function selectorOnChange(event) {
    const { value } = event.target;
    setExtensionPeriod(parseInt(value, 10));
  }

  function mySave(){
    const newExpirationMinutes = expiration_minutes + extensionPeriod;

  }

  return (
    <div
      className={hidden ? classes.hidden : classes.exension}
    >
      <ExpirationSelector
        value={extensionPeriod}
        onChange={selectorOnChange}
      />
      <Button
        onClick={mySave}
      >
        Extend
      </Button>
    </div>
  );

}

DeadlineExtender.propTypes = {
  market: PropTypes.any.isRequired,
  hidden: PropTypes.bool,
  onSave: PropTypes.func,
  onCancel: PropTypes.func
}