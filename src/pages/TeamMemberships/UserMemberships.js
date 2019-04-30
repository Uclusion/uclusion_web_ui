/* eslint-disable react/forbid-prop-types */
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { withStyles, Button } from '@material-ui/core';
import { getInvestibles } from '../../store/MarketInvestibles/reducer';
import Activity from '../../containers/Activity/Activity';
import UserMembershipsList from '../../components/TeamMemberships/UserMembershipsList';
import { withUserAndPermissions } from '../../components/UserPermissions/UserPermissions';
import { getClient } from '../../config/uclusionClient';
import { ERROR, sendIntlMessage } from '../../utils/userMessage';
import { withMarketId } from '../../components/PathProps/MarketId';
import InvestibleDetail from '../../components/Investibles/InvestibleDetail';
import UserDetail from '../../components/TeamMemberships/UserDetail';
import TeamsSearchBox from '../../components/TeamMemberships/TeamsSearchBox';

const styles = theme => ({
  content: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  favoriteButton: {
    margin: theme.spacing.unit,
  },
});

function UserMemberships(props) {
  const [teams, setTeams] = useState(undefined);
  const [allUsers, setAllUsers] = useState({});
  const [favoriteTeams, setFavoriteTeams] = useState([]);
  const [showFavorite, setShowFavorite] = useState(false);
  const {
    intl,
    userPermissions,
    marketId,
    investibles,
    history,
    classes,
    upUser,
  } = props;
  const { canListAccountTeams } = userPermissions;
  const { location: { hash, pathname } } = history;

  function getMarketInvestibles() {
    if (marketId in investibles) {
      return investibles[marketId];
    }

    return [];
  }

  function toggleShowFavorite() {
    setShowFavorite(!showFavorite);
  }

  function toggleFavoriteTeam(team) {
    let newFavoriteTeams;
    if (favoriteTeams.includes(team.id)) {
      newFavoriteTeams = favoriteTeams.filter(id => id !== team.id);
    } else {
      newFavoriteTeams = [...favoriteTeams, team.id];
    }
    setFavoriteTeams(newFavoriteTeams);
  }

  function getFilteredTeams() {
    const teamsWithFavorite = teams.map(team => ({ ...team, favorite: favoriteTeams.includes(team.id) }));
    if (showFavorite) {
      return teamsWithFavorite.filter(({ favorite }) => favorite);
    }

    return teamsWithFavorite;
  }

  // Second argument prevents re-running on teams property changes - only for changes in listed
  useEffect(() => {
    const clientPromise = getClient();
    if (canListAccountTeams) {
      clientPromise.then(client => client.teams.list(marketId)).then((marketTeams) => {
        setTeams(marketTeams);
      }).catch((error) => {
        console.log(error);
        sendIntlMessage(ERROR, { id: 'teamsLoadFailed' });
      });
    } else {
      clientPromise.then(client => client.teams.mine(marketId)).then((myTeams) => {
        setTeams(myTeams);
      }).catch((error) => {
        console.log(error);
        sendIntlMessage(ERROR, { id: 'teamsLoadFailed' });
      });
    }
    return () => {};
  }, [marketId]);

  let selectedTeamId = null;
  let investibleDetail = null;
  let userDetail = null;
  let userDetailIsMe = null;
  if (hash) {
    const hashPart = hash.substr(1).split(':');
    if (hashPart.length >= 2) {
      const hashKey = hashPart[0];
      const hashValue = hashPart[1];
      if (hashKey === 'investible') {
        const allInvestibles = investibles[marketId] || [];
        for (const investible of allInvestibles) { //eslint-disable-line
          if (investible.id === hashValue) {
            investibleDetail = investible;
            break;
          }
        }
      } else if (hashKey === 'user') {
        userDetail = allUsers[hashValue];
        userDetailIsMe = upUser && (hashValue === upUser.id);
      } else if (hashKey === 'team') {
        selectedTeamId = hashValue;
      }
    }
  }

  return (
    <Activity
      isLoading={teams === undefined}
      containerStyle={{ overflow: 'hidden' }}
      title={userDetailIsMe ? intl.formatMessage({ id: 'teamMembershipsMyInvestmentsTitle' }) : intl.formatMessage({ id: 'myTeamsMenu' })}
    >
      <div className={classes.content}>
        {teams && teams.length > 10 && (
          <div className={classes.toolbar}>
            <TeamsSearchBox />
            <Button
              className={classes.favoriteButton}
              variant="contained"
              color="primary"
              onClick={toggleShowFavorite}
            >
              {intl.formatMessage({ id: showFavorite ? 'showAll' : 'showFavorite' })}
            </Button>
          </div>
        )}
        {teams && (
          <UserMembershipsList
            teams={getFilteredTeams()}
            setTeams={setTeams}
            investibles={getMarketInvestibles()}
            setUsers={setAllUsers}
            allUsers={allUsers}
            selectedTeamId={selectedTeamId}
            onToggleFavorite={toggleFavoriteTeam}
          />
        )}
        {investibleDetail && teams && (
          <InvestibleDetail
            investible={investibleDetail}
            onClose={() => history.push(pathname)}
          />
        )}
        {userDetail && teams && Object.keys(allUsers).length > 0 && (
          <UserDetail
            user={userDetail}
            teams={teams}
            setTeams={setTeams}
            users={allUsers}
            setUsers={setAllUsers}
            investibles={getMarketInvestibles()}
            onClose={() => history.push(pathname)}
          />
        )}
      </div>
    </Activity>
  );
}

UserMemberships.propTypes = {
  userPermissions: PropTypes.object.isRequired,
  upUser: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired,
  intl: PropTypes.object.isRequired,
  investibles: PropTypes.object, //eslint-disable-line
};

const mapStateToProps = state => ({
  investibles: getInvestibles(state.investiblesReducer),
});

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(injectIntl(withUserAndPermissions(withMarketId(withStyles(styles)(UserMemberships)))));
