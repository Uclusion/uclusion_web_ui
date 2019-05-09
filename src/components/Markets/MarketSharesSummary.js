import React from 'react';
import { injectIntl } from 'react-intl';
import { Badge, Chip } from '@material-ui/core';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  ushares: {
    display: 'flex',
    justifyContent: 'space-between',
    maxWidth: 450,
    alignItems: 'center',
    marginTop: theme.spacing.unit * 3,
    marginBottom: theme.spacing.unit * 3,
  },
  investiblesBadge: {
    right: -theme.spacing.unit,
    transform: 'translateY(-50%)',
  },
});

function MarketSharesSummary(props) {
  const {
    intl, activeInvestments, unspent, classes, stacked,
  } = props;

  return (stacked && (
    <div>
      <div className={classes.ushares}>
        <Badge
          classes={{ badge: classes.investiblesBadge }}
          max={1000000}
          badgeContent={unspent}
          color="primary"
        >
          <Chip
            label={intl.formatMessage({ id: 'marketUnspent' })}
            variant="outlined"
          />
        </Badge>
      </div>
      <div className={classes.ushares}>
        <Badge
          classes={{ badge: classes.investiblesBadge }}
          max={1000000}
          badgeContent={activeInvestments}
          color="primary"
        >
          <Chip
            label={intl.formatMessage({ id: 'marketActiveInvestments' })}
            variant="outlined"
          />
        </Badge>
      </div>
    </div>
  )) || (!stacked && (
    <div className={classes.ushares}>
      <Badge
        classes={{ badge: classes.investiblesBadge }}
        max={1000000}
        badgeContent={unspent}
        color="primary"
      >
        <Chip
          label={intl.formatMessage({ id: 'marketUnspent' })}
          variant="outlined"
        />
      </Badge>
      <Badge
        classes={{ badge: classes.investiblesBadge }}
        max={1000000}
        badgeContent={activeInvestments}
        color="primary"
      >
        <Chip
          label={intl.formatMessage({ id: 'marketActiveInvestments' })}
          variant="outlined"
        />
      </Badge>
    </div>
  ));
}

MarketSharesSummary.propTypes = {
  unspent: PropTypes.number.isRequired,
  activeInvestments: PropTypes.number.isRequired,
  intl: PropTypes.object.isRequired,
  stacked: PropTypes.bool,
};


export default injectIntl(withStyles(styles)(MarketSharesSummary));
