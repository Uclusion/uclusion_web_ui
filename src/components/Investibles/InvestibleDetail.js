import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { injectIntl } from 'react-intl';
import { withStyles } from '@material-ui/core/styles';
import {
  IconButton,
  Typography,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import InvestibleListItemTabs from './InvestibleListItemTabs';
import HtmlRichTextEditor from '../TextEditors/HtmlRichTextEditor';
import InvestibleFollowUnfollow from './InvestibleFollowUnfollow';
import InvestibleDelete from './InvestibleDelete';
import InvestibleEdit from './InvestibleEdit';
import { withUserAndPermissions } from '../UserPermissions/UserPermissions';

const styles = theme => ({
  root: {
    position: 'fixed',
    width: 400,
    height: '100%',
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'white',
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)',
    zIndex: 999,
    padding: theme.spacing.unit * 2,
    paddingTop: 64 + theme.spacing.unit * 2,
    boxSizing: 'border-box',
    transition: theme.transitions.create(['right'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  detailOpen: {
    right: 0,
  },
  detailClose: {
    right: '-100%',
  },
  flex: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  row: {
    marginBottom: theme.spacing.unit,
    '&:last-child': {
      marginBottom: 0,
    },
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
  bottomActions: {
    display: 'flex',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  investibleName: {
    paddingTop: theme.spacing.unit * 1.25,
    paddingBottom: theme.spacing.unit,
    fontWeight: 'bold',
    maxWidth: 380,
    wordWrap: 'break-word',
  },
});

class InvestibleDetail extends React.PureComponent {

  componentDidUpdate() {
    const { investible } = this.props;
    if (investible) {
      this.lastInvestible = investible;
    }
  }

  getNextStageContent(investible){
    const { intl, classes } = this.props;
    if (investible.next_stage_name) {
      return (<div className={classNames(classes.flex, classes.row)}>
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
    return (<div />);
  }

  render() {
    const {
      classes,
      intl,
      onClose,
      userPermissions,
    } = this.props;
    const show = !!this.props.investible;
    const investible = this.props.investible || this.lastInvestible || {};
    const { canDeleteMarketInvestible, canEditMarketInvestible } = userPermissions;

    return (
      <div
        className={classNames(classes.root, {
          [classes.detailOpen]: show,
          [classes.detailClose]: !show,
        })}
      >
        <div className={classes.flex}>
          <Typography variant="h6" className={classes.investibleName}>
            {investible.name}
          </Typography>
          <IconButton aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </div>
        <Typography component="div">
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
        <div style={{ flex: 1, overflow: 'auto' }}>
          <HtmlRichTextEditor style={{ minHeight: 'auto' }} value={investible.description} readOnly />
          <InvestibleListItemTabs
            name={investible.name}
            quantity={investible.quantity}
            investibleId={investible.id}
            marketId={investible.market_id}
            currentUserInvestment={investible.current_user_investment}
          />
        </div>
        <div className={classNames(classes.bottomActions)}>
          <InvestibleFollowUnfollow investible={investible} useIconButton />
          {canDeleteMarketInvestible && <InvestibleDelete investible={investible} onCloseDetail={onClose} />}
          {canEditMarketInvestible && <InvestibleEdit investibleId={investible.id} />}
        </div>
      </div>
    );
  }
}

InvestibleDetail.propTypes = {
  classes: PropTypes.object.isRequired, //eslint-disable-line
  investible: PropTypes.object.isRequired, //eslint-disable-line
  onClose: PropTypes.func.isRequired,
  userPermissions: PropTypes.object.isRequired, //eslint-disable-line
};

export default injectIntl(withUserAndPermissions(withStyles(styles)(InvestibleDetail)));
