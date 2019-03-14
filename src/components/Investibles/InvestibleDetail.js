import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import {
  IconButton,
  Typography,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import InvestibleListItemTabs from './InvestibleListItemTabs';
import HtmlRichTextEditor from '../TextEditors/HtmlRichTextEditor';

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
  investibleName: {
    paddingTop: theme.spacing.unit * 1.25,
    paddingBottom: theme.spacing.unit,
    fontWeight: 'bold',
  },
});

class InvestibleDetail extends React.PureComponent {
  render() {
    const {
      classes,
      intl,
      investible = {},
      show = false,
      onClose,
    } = this.props;

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
        <HtmlRichTextEditor style={{ minHeight: 'auto' }} value={investible.description} readOnly />
        <InvestibleListItemTabs
          name={investible.name}
          quantity={investible.quantity}
          investibleId={investible.id}
          marketId={investible.market_id}
          teamId={investible.teamId}
          sharesAvailable={investible.sharesAvailable}
          currentUserInvestment={investible.current_user_investment}
        />
      </div>
    );
  }
}

InvestibleDetail.propTypes = {
  classes: PropTypes.object.isRequired, //eslint-disable-line
  intl: PropTypes.object.isRequired, //eslint-disable-line
  investible: PropTypes.object.isRequired, //eslint-disable-line
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default injectIntl(withStyles(styles)(InvestibleDetail));
