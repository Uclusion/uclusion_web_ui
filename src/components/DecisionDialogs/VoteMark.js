import React from 'react';
import { IconButton, makeStyles } from '@material-ui/core';
import { green, grey } from '@material-ui/core/colors';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';

const useStyles = makeStyles(theme => ({
  disabled: {
    color: grey[500],
  },
  enabled: {},
  invested: {
    color: green[500],
  },

}));

function VoteMark(props) {

  const { disabled, invested, onClick } = props;
  const classes = useStyles();

  function getClassName() {
    if (disabled) {
      return classes.disabled;
    }
    if (invested) {
      return classes.invested;
    }
    return classes.enabled;
  }

  return (
    <IconButton onClick={onClick}><CheckCircleIcon className={getClassName()} /></IconButton>
  );
}

export default VoteMark;
