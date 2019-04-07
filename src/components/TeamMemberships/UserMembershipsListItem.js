/* eslint-disable react/forbid-prop-types */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  Card,
  Typography,
  Badge,
  Chip,
  Tabs,
  Tab,
} from '@material-ui/core';
import withWidth from '@material-ui/core/withWidth';
import { withStyles } from '@material-ui/core/styles';
import _ from 'lodash';
import moment from 'moment';
import { injectIntl } from 'react-intl';
import { getClient } from '../../config/uclusionClient';
import { ERROR, sendIntlMessage } from '../../utils/userMessage';
import { withMarketId } from '../PathProps/MarketId';
import MemberList from './MemberList';
import InvestiblesList from './InvestiblesList';
import { getCurrentUser } from '../../store/Users/reducer';
import AdminUserItem from './AdminUserItem';
import { withUserAndPermissions } from '../UserPermissions/UserPermissions';

const styles = theme => ({
  root: {
    width: 500,
    minWidth: 400,
    padding: theme.spacing.unit,
    boxSizing: 'border-box',
  },
  container: {
    padding: theme.spacing.unit * 2,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
  },
  title: {
    marginBottom: 0,
  },
  ushares: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.unit * 3,
    marginBottom: theme.spacing.unit * 3,
  },
  lastInvestmentDate: {
    color: theme.palette.grey[600],
  },
  investiblesBadge: {
    right: -theme.spacing.unit,
    transform: 'translateY(-50%)',
  },
  tabBar: {
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
  },
  tab: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    overflowY: 'auto',
  },
});

function UserMembershipsListItem(props) {
  const [tabIndex, setTabIndex] = useState(0);
  const [investiblesForTeam, setInvestiblesForTeam] = useState(undefined);
  const [userIds, setUserIds] = useState(undefined);
  const [teamUser, setTeamUser] = useState(undefined);
  const {
    team,
    teams,
    investibles,
    marketId,
    classes,
    allUsers,
    allTeamUsers,
    setUsers,
    setTeams,
    numTeams,
    userPermissions,
  } = props;
  const {
    name,
    description,
    shared_quantity,
    team_size,
    quantity_invested,
    quantity,
    last_investment_updated_at,
  } = team;
  const { canGrant } = userPermissions;
  const lastInvestDate = moment(last_investment_updated_at).format('MM/DD/YYYY hh:mm A');

  function processUser(user) {
    const processed = { ...user };
    const marketPresence = user.market_presences.find(presence => presence.market_id === marketId);
    processed.quantity = marketPresence.quantity;
    processed.quantityInvested = marketPresence.quantity_invested;
    return processed;
  }

  function usersFetched(teamId, users) {
    const newUserIds = [];
    allTeamUsers[teamId] = {};
    users.forEach((user) => {
      allTeamUsers[teamId][user.id] = user;
      newUserIds.push(user.id);
    });
    setUserIds(newUserIds);
    if (Object.keys(allTeamUsers).length === numTeams) {
      let flattened = {};
      Object.keys(allTeamUsers).forEach((teamId) => {
        flattened = { ...flattened, ...allTeamUsers[teamId] };
      });
      console.log(flattened);
      setUsers(flattened);
    }
  }
  function getInvestible(typeObjectId) {
    return investibles.find(({ id }) => typeObjectId.includes(id));
  }
  useEffect(() => {
    let globalClient;
    const clientPromise = getClient();
    clientPromise.then((client) => {
      globalClient = client;
      return client.teams.get(team.id);
    }).then((response) => {
      const processedUsers = response.users.map(user => processUser(user));
      const teamUsers = _.remove(processedUsers, user => user.type !== 'USER');
      setTeamUser(teamUsers[0]);
      usersFetched(team.id, processedUsers);
      return globalClient.markets.listUserInvestments(marketId, team.user_id, 10000);
    }).then((investments) => {
      setInvestiblesForTeam(investments.map((investment) => {
        const processedInvestment = { ...investment };
        processedInvestment.quantityInvested = investment.quantity;
        return { ...processedInvestment, ...getInvestible(investment.type_object_id) };
      }));
    }).catch((error) => {
      console.log(error);
      sendIntlMessage(ERROR, { id: 'teamMemberLoadFailed' });
    });
    return () => {};
  }, [marketId]);

  return (
    <div className={classes.root}>
      <Card className={classes.container}>
        <Typography className={classes.title} variant="h6" paragraph>
          {name}
        </Typography>
        {last_investment_updated_at && (
          <Typography className={classes.lastInvestmentDate}>
            {'Last invested at:  '}
            {lastInvestDate}
          </Typography>
        )}
        <div className={classes.ushares}>
          <Typography>uShares:</Typography>
          <Badge
            classes={{ badge: classes.investiblesBadge }}
            max={1000000}
            badgeContent={shared_quantity}
            color="primary"
          >
            <Chip
              label="Shared"
              variant="outlined"
            />
          </Badge>
          <Badge
            classes={{ badge: classes.investiblesBadge }}
            max={1000000}
            badgeContent={quantity}
            color="primary"
          >
            <Chip
              label="Available"
              variant="outlined"
            />
          </Badge>
          <Badge
            classes={{ badge: classes.investiblesBadge }}
            max={1000000}
            badgeContent={quantity_invested}
            color="primary"
          >
            <Chip
              label="Invested"
              variant="outlined"
            />
          </Badge>
        </div>
        <Typography>
          {description}
        </Typography>
        <Tabs
          value={tabIndex}
          className={classes.tabBar}
          onChange={(e, v) => setTabIndex(v)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab
            className={classes.tab}
            label={`${team_size} Members`}
          />
          <Tab
            className={classes.tab}
            label="Investibles"
          />
          {canGrant && (
            <Tab className={classes.tab} label="Administer" />
          )}
        </Tabs>
        <div className={classes.tabContent}>
          {tabIndex === 0 && (
            <MemberList
              allUsers={allUsers}
              userIds={userIds}
            />
          )}
          {tabIndex === 1 && investiblesForTeam && (
            <InvestiblesList
              investibles={investiblesForTeam}
            />
          )}
          {tabIndex === 2 && teamUser && (
            <AdminUserItem
              teams={teams}
              setTeams={setTeams}
              users={allUsers}
              setUsers={setUsers}
              user={teamUser}
            />
          )}
        </div>
      </Card>
    </div>
  );
}

UserMembershipsListItem.propTypes = {
  team: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    description: PropTypes.string,
    team_size: PropTypes.number,
    shared_amount: PropTypes.number,
  }).isRequired,
  investibles: PropTypes.arrayOf(PropTypes.object),
  classes: PropTypes.object.isRequired,
  width: PropTypes.string.isRequired,
  setUsers: PropTypes.func.isRequired,
  allUsers: PropTypes.object.isRequired, //eslint-disable-line
  numTeams: PropTypes.number.isRequired,
  setTeams: PropTypes.func, //eslint-disable-line
  teams: PropTypes.arrayOf(PropTypes.object), //eslint-disable-line
  userPermissions: PropTypes.object.isRequired, //eslint-disable-line
};

const mapStateToProps = state => ({
  user: getCurrentUser(state.usersReducer),
  investibleDetail: state.detail.investible,
});

export default connect(mapStateToProps)(withUserAndPermissions(
  injectIntl(withWidth()(withStyles(styles)(withMarketId(UserMembershipsListItem)))),
));
