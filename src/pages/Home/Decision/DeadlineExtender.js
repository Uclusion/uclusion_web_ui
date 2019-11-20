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
  const { market, hidden } = props;
  const { id, expires_at, expiration_minutes } = props;
  const classes = useStyles();

  const [extensionPeriod, setExtensionPeriod] = useState(1440);

  function selectorOnChange(event) {
    const { value } = event.target;
    setExtensionPeriod(parseInt(value, 10));
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
        onClick={}
      >
        Extend
      </Button>
    </div>
  );

}