/* eslint-disable react/forbid-prop-types */
import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  Card,
  Typography,
  Tabs,
  Tab,
  IconButton,
} from '@material-ui/core';
import withWidth from '@material-ui/core/withWidth';
import { withStyles } from '@material-ui/core/styles';
import VolumeUp from '@material-ui/icons/VolumeUp';
import VolumeOffSharp from '@material-ui/icons/VolumeOffSharp';
import _ from 'lodash';
import { injectIntl } from 'react-intl';
import { getClient } from '../../config/uclusionClient';
import { ERROR, sendIntlMessage } from '../../utils/userMessage';
import { withMarketId } from '../PathProps/MarketId';
import MemberList from './MemberList';
import InvestiblesList from './InvestiblesList';
import { getCurrentUser, getAllUsers } from '../../store/Users/reducer';
import { usersFetched } from '../../store/Users/actions';
import AdminUserItem from './AdminUserItem';
import { withUserAndPermissions } from '../UserPermissions/UserPermissions';
import TeamSharesSummary from './TeamSharesSummary';

const styles = theme => ({
  root: {
    width: 400,
    minWidth: 400,
    height: '100%',
    padding: theme.spacing.unit,
    boxSizing: 'border-box',
  },
  teamSelected: {
    boxShadow: '0 0 5px blue',
  },
  container: {
    padding: theme.spacing.unit * 2,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    marginBottom: 0,
  },
  toolbarButton: {
    padding: theme.spacing.unit * 0.5,
    color: theme.palette.primary.main,
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
    minWidth: 80,
  },
  tabLabelContainer: {
    padding: 6,
  },
  tabContent: {
    flex: 1,
    overflowY: 'auto',
  },
});

function UserMembershipsListItem(props) {
  const [tabIndex, setTabIndex] = useState("investibles");
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
    setTeams,
    userPermissions,
    intl,
    selected,
    onToggleFavorite,
    dispatch,
  } = props;
  const {
    name,
    description,
    team_size,
    quantity_invested,
    shared_quantity,
    quantity,
    last_investment_updated_at,
    current_user_is_following,
  } = team;
  const { canGrant } = userPermissions;
  const totalQuantity = shared_quantity + quantity;
  const dateFormatOptions = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  };
  const lastInvestDate = intl.formatDate(last_investment_updated_at, dateFormatOptions);


  function teamUsersFetched(teamId, users) {
    const newUserIds = [];
    const usersHash = {};
    users.forEach((user) => {
      usersHash[user.id] = user;
      newUserIds.push(user.id);
    });
    setUserIds(newUserIds);
    dispatch(usersFetched(usersHash));
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
      const { users } = response;
      const teamUsers = _.remove(users, user => user.type !== 'USER');
      setTeamUser(teamUsers[0]);
      teamUsersFetched(team.id, users);
      return globalClient.markets.summarizeUserInvestments(marketId, team.user_id);
    }).then((investments) => {
      // only process investments which we have investibles for
      const filtered = investments.filter(investment => getInvestible(investment.type_object_id));
      setInvestiblesForTeam(filtered.map((investment) => {
        const processedInvestment = { ...investment };
        processedInvestment.quantityInvested = investment.quantity;
        return { ...processedInvestment, ...getInvestible(investment.type_object_id)};
      }));
    }).catch((error) => {
      console.error(error);
      sendIntlMessage(ERROR, { id: 'teamMemberLoadFailed' });
    });
    return () => {};
  }, [marketId, investibles]);

  return (
    <div className={classes.root}>
      <Card className={classNames(classes.container, { [classes.teamSelected]: selected })}>
        <div className={classes.header}>
          <Typography className={classes.title} variant="h6" paragraph>
            {name}
          </Typography>
          <IconButton
            className={classes.toolbarButton}
            onClick={() => onToggleFavorite(team)}
          >
            {current_user_is_following ? <VolumeOffSharp /> : <VolumeUp />}
          </IconButton>
        </div>
        {last_investment_updated_at && (
          <Typography className={classes.lastInvestmentDate}>
            {intl.formatMessage({id: 'teamMembershipsLastInvested' }, { date: lastInvestDate})}
          </Typography>
        )}
        <TeamSharesSummary quantity={totalQuantity} quantity_invested={quantity_invested}/>
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
            value="members"
            className={classes.tab}
            classes={{ labelContainer: classes.tabLabelContainer }}
            label={`${team_size} ${intl.formatMessage({ id: 'members' })}`}
          />
          <Tab
            value="investibles"
            className={classes.tab}
            classes={{ labelContainer: classes.tabLabelContainer }}
            label={intl.formatMessage({ id: 'investibles' })}
          />
          {canGrant && (
            <Tab
              value="administer"
              className={classes.tab}
              classes={{ labelContainer: classes.tabLabelContainer }}
              label={intl.formatMessage({ id: 'administer' })}
            />
          )}
        </Tabs>
        <div className={classes.tabContent}>
          {tabIndex === "members" && (
            <MemberList
              allUsers={allUsers}
              userIds={userIds}
              marketId={marketId}
            />
          )}
          {tabIndex === "investibles" && investiblesForTeam && (
            <InvestiblesList
              investibles={investiblesForTeam}
            />
          )}
          {tabIndex === "administer" && teamUser && (
            <AdminUserItem
              teams={teams}
              setTeams={setTeams}
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
  allUsers: PropTypes.object.isRequired, //eslint-disable-line
  setTeams: PropTypes.func, //eslint-disable-line
  teams: PropTypes.arrayOf(PropTypes.object), //eslint-disable-line
  userPermissions: PropTypes.object.isRequired, //eslint-disable-line
  intl: PropTypes.object.isRequired,
};

const mapStateToProps = state => ({
  user: getCurrentUser(state.usersReducer),
  investibleDetail: state.detail.investible,
  allUsers: getAllUsers(state.usersReducer),
});

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withUserAndPermissions(
  injectIntl(withWidth()(withStyles(styles)(withMarketId(UserMembershipsListItem)))),
));
