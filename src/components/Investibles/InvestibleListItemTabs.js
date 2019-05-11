import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { withUserAndPermissions } from '../UserPermissions/UserPermissions';
import InvestibleInvest from './InvestibleInvest';
import CommentsList from './Comments/CommentsList';
import InvestingTeamsList from './InvestingTeamsList';
import { getCurrentUser } from '../../store/Users/reducer';
import { getClient } from '../../config/uclusionClient';
import { ERROR, sendIntlMessage } from '../../utils/userMessage';

const styles = theme => ({
  paper: {
    flexGrow: 1,
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
  const [value, setValue] = useState(undefined);
  const [investingTeams, setInvestingTeams] = useState([]);

  const {
    classes,
    marketId,
    investibleId,
    intl,
    user,
    currentUserInvestment,
    openForInvestment,
    userPermissions,
    quantity,
  } = props;
  const { isMarketAdmin, canInvest, canReadComments } = userPermissions;
  const investmentAllowed = canInvest && openForInvestment;
  useEffect(() => {
    if (value === undefined) {
      setValue(canInvest ? 'invest' : 'comments');
    }
    if (isMarketAdmin) {
      const clientPromise = getClient();
      clientPromise.then(client => client.investibles.getInvestingTeams(investibleId))
        .then((response) => {
          setInvestingTeams(response);
        })
        .catch((error) => {
          console.error(error);
          sendIntlMessage(ERROR, { id: 'investingTeamsFailed' });
        });
    }
  }, [investibleId, quantity]);

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
          <Tab className={classes.tab} label={intl.formatMessage({ id: 'investTab' })} value="invest" />
        )}
        {canReadComments && (
          <Tab
            className={classes.tab}
            label={intl.formatMessage({ id: 'commentsTab' })}
            value="comments"
          />
        )}
        {isMarketAdmin && (
          <Tab
            className={classes.tab}
            label={intl.formatMessage({ id: 'investorsTab' })}
            value="investors"
          />
        )}
      </Tabs>

      <div className={classes.tabContent}>
        {value === 'invest' && investmentAllowed && user && (
          <InvestibleInvest
            teamId={user.default_team_id}
            marketId={marketId}
            sharesAvailable={user.market_presence.quantity}
            currentUserInvestment={currentUserInvestment}
            investibleId={investibleId}
          />
        )}
        {value === 'comments' && (
          <CommentsList
            marketId={marketId}
            currentUserInvestment={currentUserInvestment}
            investibleId={investibleId}
          />
        )}
        {value === 'investors' && isMarketAdmin && (
          <InvestingTeamsList
            marketId={marketId}
            teams={investingTeams}
          />
        )}
      </div>
    </div>
  );
}

InvestibleListItemTabs.propTypes = {
  classes: PropTypes.object.isRequired,
  investibleId: PropTypes.string.isRequired,
  marketId: PropTypes.string.isRequired,
  user: PropTypes.object,
  currentUserInvestment: PropTypes.number.isRequired,
  userPermissions: PropTypes.object.isRequired,
  openForInvestment: PropTypes.bool.isRequired,
  intl: PropTypes.object.isRequired, //eslint-disable-line
  quantity: PropTypes.number.isRequired,
};

const mapStateToProps = state => ({
  user: getCurrentUser(state.usersReducer),
});

function mapDispatchToProps(dispatch){
  return { dispatch };
}

export default connect(mapStateToProps, mapDispatchToProps)(injectIntl(withStyles(styles)(withUserAndPermissions(InvestibleListItemTabs))));
