import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import InvestibleInvest from './InvestibleInvest';
import CommentsList from './Comments/CommentsList';
import { getCurrentUser } from '../../store/Users/reducer';
import { getFlags } from '../../utils/userFunctions'

const styles = theme => ({
  paper: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  tab: {
    minWidth: 'unset',
    maxWidth: 'unset',
    flex: 1,
  },
  tabBar: {
    marginBottom: theme.spacing.unit * 2,
  },
  tabContent: {
    overflow: 'auto',
  },
});

function InvestibleDetailTabs(props) {
  const {
    classes,
    marketId,
    investibleId,
    intl,
    user,
    currentUserInvestment,
    openForInvestment,
  } = props;
  const investmentAllowed = true;

  let initialTab = '';
  if (investmentAllowed) {
    initialTab = 'invest';
  } else {
    initialTab = 'comments';
  }
  const [value, setValue] = useState(initialTab);

  function handleChange(event, value) {
    setValue(value);
  }

  return (
    <div className={classes.paper}>
      <Tabs
        value={value}
        className={classes.tabBar}
        onChange={handleChange}
        indicatorColor="primary"
        textColor="primary"
      >
        {investmentAllowed && (
          <Tab
            className={classes.tab}
            label={intl.formatMessage({ id: 'investTab' })}
            value="invest"
          />
        )}
        <Tab
            className={classes.tab}
            label={intl.formatMessage({ id: 'commentsTab' })}
            value="comments"
        />
      </Tabs>

      <div className={classes.tabContent}>
        {value === 'invest' && investmentAllowed && user && (
          <InvestibleInvest
            teamId={user.default_team_id}
            sharesAvailable={100}//{user.market_presence.quantity}
            currentUserInvestment={currentUserInvestment}
            investibleId={investibleId}
          />
        )}
        {value === 'comments' && (
          <CommentsList
            marketId={marketId}
            currentUserInvestment={currentUserInvestment}
            user={user}
            investibleId={investibleId}
          />
        )}
       </div>
    </div>
  );
}

InvestibleDetailTabs.propTypes = {
  classes: PropTypes.object.isRequired, //eslint-disable-line
  investibleId: PropTypes.string.isRequired,
  marketId: PropTypes.string.isRequired,
  user: PropTypes.object, //eslint-disable-line
  currentUserInvestment: PropTypes.number.isRequired,
  openForInvestment: PropTypes.bool.isRequired,
  intl: PropTypes.object.isRequired, //eslint-disable-line
  quantity: PropTypes.number.isRequired,
  subscribed: PropTypes.bool.isRequired,
};

const mapStateToProps = state => ({
  user: getCurrentUser(state.usersReducer),
});

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(injectIntl(withStyles(styles)(InvestibleDetailTabs)));
