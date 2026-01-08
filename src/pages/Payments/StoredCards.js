import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
// this is the styling for OUR components
const useStyles = makeStyles(theme => {
  return {
  };
});

function capitalize(string) {
  if (_.isEmpty(string)) {
    return string;
  }
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function StoredCards (props) {
  const {
    billingInfo = []
  } = props;
  const classes = useStyles();

  if (_.isEmpty(billingInfo)) {
    return (
      <div className={classes.cardInfo}>
        <Typography>
          You have no cards on file.
        </Typography>
      </div>);
  }

  const cardInfos = billingInfo.map(cardInfo => {
    const {
      brand,
      last4,
      exp_month: expMonth,
      exp_year: expYear
    } = cardInfo;
    return (
      <Typography>
        {capitalize(brand)} ending in {last4} and expiring {expMonth}/{expYear}.
      </Typography>
    );
  });

  return (
    <div className={classes.cardInfo}>
      <Typography>
        You have the following card on file:
      </Typography>
      {cardInfos}
    </div>
  );
}

StoredCards.propTypes = {
  billingInfo: PropTypes.arrayOf(PropTypes.object),
};

export default StoredCards;