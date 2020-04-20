import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles, Typography } from '@material-ui/core';
import { useIntl } from 'react-intl';

const useStyles = makeStyles(() => {
  return {
    expiresWarning: {
      color: '#ca2828',
      fontWeight: 'bold',
      fontSize: '.7rem'
    },
  };
});

function ExpiredDisplay(props) {

  const {
    expiresDate,
  } = props;

  const classes = useStyles();
  const intl = useIntl();

  return (
    <Typography className={classes.expiresWarning}>
      {intl.formatMessage({ id: 'summaryExpiredAt'}, {expireDate: intl.formatDate(expiresDate)})}
    </Typography>
  )

}

ExpiredDisplay.propTypes = {
  expiresDate: PropTypes.instanceOf(Date).isRequired,
};

export default ExpiredDisplay;