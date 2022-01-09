import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { CircularProgress, Grid, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles(() => {
  return {
    loadingDisplay: {
      padding: '95px 20px 156px',
      width: '100%'
    },
    loadingContainer: {
      justifyContent: 'center',
      display: 'flex',
      overflow: 'hidden',
      marginTop: 'calc(50vh - 60px)'
    },
    loadingContainerNoMargin: {
      justifyContent: 'center',
      display: 'flex',
      overflow: 'hidden'
    },
    loadingColor: {
      fill: '#3f6b72'
    }
  };
});

function LoadingDisplay (props) {

  const { size, messageId, showMessage, noMargin } = props;
  const classes = useStyles();
  const intl = useIntl();
  const message = intl.formatMessage({ id: messageId });

  return (
    <Grid
      container
      direction="column">
      <Grid id="spinner" item className={noMargin ? classes.loadingContainerNoMargin : classes.loadingContainer}>
        <div align='center'>
          {showMessage && (<Typography>{message}</Typography>)}
          <CircularProgress className={classes.loadingColor} size={size} type="indeterminate"/>
        </div>
      </Grid>
    </Grid>
  );
}

LoadingDisplay.propTypes = {
  size: PropTypes.number,
  messageId: PropTypes.string,
  showMessage: PropTypes.bool,
};

LoadingDisplay.defaultProps = {
  size: 120,
  messageId: 'loadingMessage',
  showMessage: false,
};

export default LoadingDisplay;