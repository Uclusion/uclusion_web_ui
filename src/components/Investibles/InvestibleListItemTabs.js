import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import InvestibleInvest from './InvestibleInvest';
import CommentsList from './Comments/CommentsList';
import InvestingTeamsList from './InvestingTeamsList';
import { getCurrentUser } from '../../store/Users/reducer';
import { getClient } from '../../config/uclusionClient';
import { ERROR, sendIntlMessage } from '../../utils/userMessage';
import WorkgroupList from './WorkgroupList';

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

function InvestibleListItemTabs(props) {
  const {
    classes,
    marketId,
    investibleId,
    intl,
    user,
    currentUserInvestment,
    openForInvestment,
    quantity,
    subscribed,
  } = props;
  const { isAdmin, canInvest } = user.market_presence.flags;
  const investmentAllowed = canInvest && openForInvestment;

  let initialTab = '';
  if (investmentAllowed) {
    initialTab = 'invest';
  } else if (isAdmin) {
    initialTab = 'investors';
  } else {
    initialTab = 'comments';
  }
  const [value, setValue] = useState(initialTab);
  const [investingTeams, setInvestingTeams] = useState([]);
  const [workingUsers, setWorkingUsers] = useState([]);

  useEffect(() => {
    if (isAdmin) {
      const clientPromise = getClient();
      let globalClient;
      clientPromise.then((client) => {
        globalClient = client;
        return client.investibles.getInvestingTeams(investibleId);
      }).then((response) => {
        setInvestingTeams(response);
        return globalClient.investibles.getWorkgroup(investibleId);
      }).then((response) => {
        setWorkingUsers(response);
      }).catch((error) => {
        console.error(error);
        sendIntlMessage(ERROR, { id: 'investingTeamsFailed' });
      });
    }
  }, [investibleId, quantity, subscribed]);

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
        {isAdmin && (
          <Tab
            className={classes.tab}
            label={intl.formatMessage({ id: 'investorsTab' })}
            value="investors"
          />
        )}
        {isAdmin && (
          <Tab
            className={classes.tab}
            label={intl.formatMessage({ id: 'workgroupTab' })}
            value="workgroup"
          />
        )}
      </Tabs>

      <div className={classes.tabContent}>
        {value === 'invest' && investmentAllowed && user && (
          <InvestibleInvest
            teamId={user.default_team_id}
            sharesAvailable={user.market_presence.quantity}
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
        {value === 'investors' && isAdmin && (
          <InvestingTeamsList
            marketId={marketId}
            teams={investingTeams}
          />
        )}
        {value === 'workgroup' && isAdmin && (
          <WorkgroupList
            marketId={marketId}
            users={workingUsers}
            teamId={user.default_team_id}
          />
        )}
      </div>
    </div>
  );
}

InvestibleListItemTabs.propTypes = {
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
)(injectIntl(withStyles(styles)(InvestibleListItemTabs)));
