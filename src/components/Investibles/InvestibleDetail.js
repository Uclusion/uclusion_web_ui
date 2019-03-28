import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
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
  bottomActions: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  investibleName: {
    paddingTop: theme.spacing.unit * 1.25,
    paddingBottom: theme.spacing.unit,
    fontWeight: 'bold',
  },
});

class InvestibleDetail extends React.PureComponent {
  componentDidUpdate() {
    const { investible } = this.props;
    if (investible) {
      this.lastInvestible = investible;
    }
  }

  render() {
    const {
      classes,
      onClose,
      userPermissions,
    } = this.props;
    const show = !!this.props.investible;
    const investible = this.props.investible || this.lastInvestible || {};
    const { canDeleteMarketInvestible } = userPermissions;

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
          <InvestibleFollowUnfollow investible={investible} useIconButton={true} />
          {canDeleteMarketInvestible && <InvestibleDelete investible={investible} />}
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

export default withUserAndPermissions(withStyles(styles)(InvestibleDetail));
