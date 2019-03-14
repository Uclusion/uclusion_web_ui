import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import {
  Card,
  Typography,
} from '@material-ui/core';
import { withUserAndPermissions } from '../UserPermissions/UserPermissions';
import InvestibleDelete from './InvestibleDelete';

const styles = theme => ({
  card: {
    marginBottom: theme.spacing.unit,
    padding: theme.spacing.unit * 1.5,
    boxShadow: 'none',
    '&:last-child': {
      marginBottom: 0,
    },
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
  render() {
    const {
      classes,
      intl,
      investible,
      onClickInvestible,
      userPermissions,
    } = this.props;
    const { canDeleteMarketInvestible } = userPermissions;

    return (
      <Card className={classes.card}>
        <Typography component="div">
          <div
            className={classNames(classes.flex, classes.investibleName)}
            role="presentation"
            onClick={onClickInvestible}
          >
            {investible.name}
            {canDeleteMarketInvestible && <InvestibleDelete investible={investible} />}
          </div>
          <div className={classNames(classes.flex, classes.row)}>
            <span className={classes.stageLabel}>
              {intl.formatMessage({ id: 'currentStageLabel' })}
            </span>
            <div className={classes.stageContent}>
              <div>{intl.formatMessage({ id: investible.stage })}</div>
              <div className={classes.numSharesText}>
                {intl.formatMessage({ id: 'totalCurrentInvestmentChip' }, { shares: investible.quantity })}
              </div>
            </div>
          </div>
          <div className={classNames(classes.flex, classes.row)}>
            <span className={classes.stageLabel}>
              {intl.formatMessage({ id: 'nextStageLabel' })}
            </span>
            <div className={classes.stageContent}>
              <div>{intl.formatMessage({ id: investible.next_stage })}</div>
              <div className={classes.numSharesText}>
                {intl.formatMessage({ id: 'investmentForNextStageChip' }, { shares: investible.next_stage_threshold })}
              </div>
            </div>
          </div>
        </Typography>
      </Card>
    );
  }
}

InvestibleListItem.propTypes = {
  classes: PropTypes.object.isRequired, //eslint-disable-line
  intl: PropTypes.object.isRequired, //eslint-disable-line
  investible: PropTypes.object.isRequired, //eslint-disable-line
  onClickInvestible: PropTypes.func,
  userPermissions: PropTypes.object.isRequired, //eslint-disable-line
};

InvestibleListItem.defaultProps = {
  onClickInvestible: () => null,
};

export default injectIntl(withStyles(styles)(withUserAndPermissions(InvestibleListItem)));
