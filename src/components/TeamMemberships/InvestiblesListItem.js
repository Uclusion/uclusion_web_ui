/* eslint-disable react/forbid-prop-types */
import PropTypes from 'prop-types';
import React from 'react';
import { Link } from 'react-router-dom';
import {
  Paper,
  Typography,
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';

const styles = theme => ({
  paper: {
    marginBottom: theme.spacing.unit * 2,
    padding: theme.spacing.unit * 2,
  },
  link: {
    textDecoration: 'none',
  },
  investibleName: {
    fontWeight: 'bold',
    cursor: 'pointer',
    maxWidth: 400,
    wordWrap: 'break-word',
  },
  stage: {
    marginTop: theme.spacing.unit,
    display: 'flex',
  },
  stageLabel: {
    minWidth: 100,
  },
  investmentText: {
    fontSize: 12,
  },
});

/**
 * TODO: Unify this with the main investible list. I know it's slightly different, but I don't want to pay
 * the cost of making rendering fixes twice. It could be TOTALLY drop in if this view were powered by redux,
 * and we'd be able to follow/unfollow from this screen as well. (Which we can already do from detail)
 *
 */

class InvestiblesListItem extends React.PureComponent {
  render() {
    const { investible, intl, classes} = this.props;
    return (
      <Paper className={classes.paper}>
        <Link className={classes.link} to={`#investible:${investible.id}`}>
          <Typography className={classes.investibleName}>
            {investible.name}
          </Typography>
          <div className={classes.stage}>
            <Typography className={classes.stageLabel}>
              {intl.formatMessage({ id: 'currentStageLabel' })}
            </Typography>
            <div>
              <Typography>
                {intl.formatMessage({ id: investible.stage_name })}
              </Typography>
              <Typography className={classes.investmentText}>
                {intl.formatMessage({ id: 'totalCurrentInvestmentChip' }, { shares: investible.quantity })}
              </Typography>
            </div>
          </div>
          <div className={classes.stage}>
            <Typography className={classes.stageLabel}>
              {intl.formatMessage({ id: 'nextStageLabel' })}
            </Typography>
            <div>
              <Typography>
                {intl.formatMessage({ id: investible.next_stage_name })}
              </Typography>
              <Typography className={classes.investmentText}>
                {intl.formatMessage({ id: 'investmentForNextStageChip' }, { shares: investible.next_stage_threshold })}
              </Typography>
            </div>
          </div>
          <Typography className={classes.availableShares}>
            *
            {' '}
            {intl.formatMessage({ id: 'teamInvestedShares' }, { shares: investible.quantityInvested })}
          </Typography>
        </Link>
      </Paper>
    );
  }
}

InvestiblesListItem.propTypes = {
  investible: PropTypes.object.isRequired,
};


export default injectIntl(withStyles(styles)(InvestiblesListItem));
