import React from 'react';
import { injectIntl } from 'react-intl';
import { Badge, Chip, Typography } from '@material-ui/core';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  ushares: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.unit * 3,
    marginBottom: theme.spacing.unit * 3,
  },
  lastInvestmentDate: {
    color: theme.palette.grey[600],
  },
  investiblesBadge: {
    right: -theme.spacing.unit,
    transform: 'translateY(-50%)',
  },
});

function TeamSharesSummary(props) {

  const { intl, quantity_invested, quantity, classes } = props;


  return (<div className={classes.ushares}>
    <Typography>{intl.formatMessage({ id: 'teamMembershipsTeamUshares' })}</Typography>
    <Badge
      classes={{ badge: classes.investiblesBadge }}
      max={1000000}
      badgeContent={quantity}
      color="primary"
    >
      <Chip
        label={intl.formatMessage({ id: 'teamMembershipsSharesAvailableToTeamAndUsers' })}
        variant="outlined"
      />
    </Badge>
    <Badge
      classes={{ badge: classes.investiblesBadge }}
      max={1000000}
      badgeContent={quantity_invested}
      color="primary"
    >
      <Chip
        label={intl.formatMessage({ id: 'teamMembershipsSharesInvested' })}
        variant="outlined"
      />
    </Badge>
    <Badge
      classes={{ badge: classes.investiblesBadge }}
      max={1000000}
      badgeContent={Math.round((100.0 * quantity_invested / quantity))}
      color="primary"
    >
      <Chip
        label={intl.formatMessage({ id: 'teamMembershipsSharesInvestedPercentage' })}
        variant="outlined"
      />
    </Badge>
  </div>);
}

TeamSharesSummary.propTypes = {
  quantity: PropTypes.number.isRequired,
  quantity_invested: PropTypes.number.isRequired,
  intl: PropTypes.object.isRequired,
};


export default injectIntl(withStyles(styles)(TeamSharesSummary));
