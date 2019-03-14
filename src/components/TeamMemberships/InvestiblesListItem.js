/* eslint-disable react/forbid-prop-types */
import PropTypes from 'prop-types';
import React from 'react';
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
  investibleName: {
    fontWeight: 'bold',
    cursor: 'pointer',
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

class InvestiblesListItem extends React.PureComponent {
  render() {
    const { investible, intl, classes, onClickInvestible } = this.props;
    return (
      <Paper className={classes.paper}>
        <Typography
          className={classes.investibleName}
          role="presentation"
          onClick={onClickInvestible}
        >
          {investible.name}
        </Typography>
        <div className={classes.stage}>
          <Typography className={classes.stageLabel}>
            {intl.formatMessage({ id: 'currentStageLabel' })}
          </Typography>
          <div>
            <Typography>
              {intl.formatMessage({ id: investible.stage })}
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
              {intl.formatMessage({ id: investible.next_stage })}
            </Typography>
            <Typography className={classes.investmentText}>
              {intl.formatMessage({ id: 'investmentForNextStageChip' }, { shares: investible.next_stage_threshold })}
            </Typography>
          </div>
        </div>
      </Paper>
    );
  }
}

InvestiblesListItem.propTypes = {
  investible: PropTypes.object.isRequired,
  onClickInvestible: PropTypes.func.isRequired,
};


export default injectIntl(withStyles(styles)(InvestiblesListItem));
