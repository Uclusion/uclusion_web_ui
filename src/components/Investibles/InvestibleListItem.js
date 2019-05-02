import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { injectIntl } from 'react-intl';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import {
  Card,
  Typography,
} from '@material-ui/core';

const styles = theme => ({
  card: {
    marginBottom: theme.spacing.unit,
    padding: theme.spacing.unit * 1.5,
    boxShadow: 'none',
    '&:last-child': {
      marginBottom: 0,
    },
  },
  cardSelected: {
    boxShadow: '0 0 5px blue',
  },
  link: {
    textDecoration: 'none',
  },
  flex: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  row: {
    marginBottom: theme.spacing.unit,
    '&:last-child': {
      marginBottom: 0,
    },
  },
  investibleName: {
    marginBottom: theme.spacing.unit,
    fontWeight: 'bold',
    cursor: 'pointer',
    maxWidth: 300,
    wordWrap: 'break-word',
  },
  stageLabel: {
    minWidth: 100,
  },
  stageContent: {
    flex: 1,
  },
  numSharesText: {
    fontSize: 12,
  },
});

class InvestibleListItem extends React.PureComponent {

  getNextStageContent(investible) {
    const { classes, intl } = this.props;
    if (investible.next_stage_name) {
      return (
        <div className={classNames(classes.flex, classes.row)}>
              <span className={classes.stageLabel}>
                {intl.formatMessage({ id: 'nextStageLabel' })}
              </span>
          <div className={classes.stageContent}>
            <div>{investible.next_stage_name}</div>
            <div className={classes.numSharesText}>
              {investible.next_stage_threshold && intl.formatMessage({ id: 'investmentForNextStageChip' }, { shares: investible.next_stage_threshold })}
            </div>
          </div>
        </div>
      );
    }

    return <div />;
  }

  render() {
    const {
      classes,
      intl,
      investible,
      selected,
    } = this.props;

    return (
      <Card className={classNames(classes.card, { [classes.cardSelected]: selected })}>
        <Link className={classes.link} to={`#investible:${investible.id}`}>
          <Typography component="div">
            <div className={classes.flex}>
              <div className={classes.investibleName}>{investible.name}</div>
            </div>
            <div className={classNames(classes.flex, classes.row)}>
              <span className={classes.stageLabel}>
                {intl.formatMessage({ id: 'currentStageLabel' })}
              </span>
              <div className={classes.stageContent}>
                <div>{investible.stage_name}</div>
                <div className={classes.numSharesText}>
                  {intl.formatMessage({ id: 'totalCurrentInvestmentChip' }, { shares: investible.quantity })}
                </div>
              </div>
            </div>

            {this.getNextStageContent(investible)}

          </Typography>
          {investible.current_user_investment > 0 && (<br />)}
          <Typography className={classes.availableShares}>
            {investible.current_user_investment > 0 && `* ${intl.formatMessage({ id: 'userInvestedShares' }, { shares: investible.current_user_investment })}`}
          </Typography>
        </Link>
      </Card>
    );
  }
}

InvestibleListItem.propTypes = {
  classes: PropTypes.object.isRequired, //eslint-disable-line
  intl: PropTypes.object.isRequired, //eslint-disable-line
  investible: PropTypes.object.isRequired, //eslint-disable-line
  selected: PropTypes.bool, //eslint-disable-line
};

export default injectIntl(withStyles(styles)(InvestibleListItem));
