/* eslint-disable react/forbid-prop-types */
import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { withStyles, Button, Tooltip } from '@material-ui/core';
import { getInvestibles } from '../../store/MarketInvestibles/reducer';
import { getAllUsers } from '../../store/Users/reducer';
import Activity from '../../containers/Activity/Activity';
import UserMembershipsList from '../../components/TeamMemberships/UserMembershipsList';
import { withUserAndPermissions } from '../../components/UserPermissions/UserPermissions';
import { getClient } from '../../config/uclusionClient';
import { ERROR, sendIntlMessage, SUCCESS } from '../../utils/userMessage';
import { withMarketId } from '../../components/PathProps/MarketId';
import InvestibleDetail from '../../components/Investibles/InvestibleDetail';
import UserDetail from '../../components/TeamMemberships/UserDetail';
import TeamsSearchBox from '../../components/TeamMemberships/TeamsSearchBox';
import { formCurrentMarketLink } from '../../utils/marketIdPathFunctions';
import { loadTeams, processUserForDisplay } from '../../utils/userMembershipFunctions';
import HelpMovie from '../../components/ModalMovie/HelpMovie';

const styles = theme => ({
  content: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  toolbar: {
    width: '100%',
    display: 'flex',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  toolbarButton: {
    margin: theme.spacing.unit,
  },
});

function UserMemberships(props) {
  const [teams, setTeams] = useState(undefined);
  const [showFavorite, setShowFavorite] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const {
    intl,
    userPermissions,
    marketId,
    investibles,
    history,
    classes,
    upUser,
    allUsers,
  } = props;
  const { canListAccountTeams, canInvest } = userPermissions;
  const { location: { hash, pathname } } = history;

  function getMarketInvestibles() {
    if (marketId in investibles) {
      return investibles[marketId];
    }

    return [];
  }

  function onSearch(searchInfo){
    const { query, results } = searchInfo;
    setSearchQuery(query);
    const usableResults = results.map(result => result.ref);
    setSearchResults(usableResults);
  }

  function toggleShowFavorite() {
    setShowFavorite(!showFavorite);
  }

  function toggleFavoriteTeam(team) {
    const clientPromise = getClient();
    return clientPromise
      .then(client => client.teams.followTeam(team.id, marketId, team.current_user_is_following))
      .then((result) => {
        const newTeams = teams.map(t => ({
          ...t,
          current_user_is_following: result.teams_followed.includes(t.id),
        }));
        setTeams(newTeams);
        const followMsg = result.teams_followed.includes(team.id) ? 'teamFollowSuccess' : 'teamUnfollowSuccess';
        sendIntlMessage(SUCCESS, { id: followMsg });
      }).catch((error) => {
        console.error(error);
        sendIntlMessage(ERROR, { id: 'teamFollowFailed' });
      });
  }

  function getFilteredTeams() {
    let filtered = teams;
    if (searchQuery) {
      filtered = teams.filter(team => searchResults.includes(team.id));
    }

    // now filter search by favorites
    if (showFavorite) {
      filtered = filtered.filter(({ current_user_is_following }) => current_user_is_following);
    }
    return filtered;
  }

  // Second argument prevents re-running on teams property changes - only for changes in listed
  useEffect(() => {
    loadTeams(canListAccountTeams, marketId, setTeams);
    return () => {};
  }, [marketId, canListAccountTeams]);

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
        userDetail = processUserForDisplay(allUsers[hashValue], marketId);
        userDetailIsMe = upUser && (hashValue === upUser.id);
      } else if (hashKey === 'team') {
        selectedTeamId = hashValue;
      }
    }
  }
  function copyToClipboard(text){
    navigator.clipboard.writeText(text);
  }

  function getCognitoLink(){
    const cognitoLink = formCurrentMarketLink('Login');
    const location = window.location.href;
    const newURL = new URL(location);
    newURL.pathname = cognitoLink;
    return newURL.toString();
  }

  function getSortedTeams(teams) {
    return _.sortBy(teams, 'name');
  }

  const cognitoLink = getCognitoLink();
  return (
    <Activity
      isLoading={teams === undefined}
      containerStyle={{ overflow: 'hidden' }}
      title={userDetailIsMe ? intl.formatMessage({ id: 'teamMembershipsMyInvestmentsTitle' }) : intl.formatMessage({ id: 'myTeamsMenu' })}
    >

      <div className={classes.content}>
        {canListAccountTeams && (<HelpMovie name="teamMembershipsAdminIntro" />)}
        {!userDetailIsMe && canInvest && (<HelpMovie name="teamMembershipsUserIntro" />)}
        {userDetailIsMe && (<HelpMovie name="myInvestmentsIntro" />)}
        {canListAccountTeams && teams && (
          <div className={classes.toolbar}>
            <TeamsSearchBox teams={teams} onSearch={onSearch} />
            <Tooltip title={intl.formatMessage({ id: 'teamMembershipsEmailButtonTooltip' })}>
              <Button
                className={classes.toolbarButton}
                variant="contained"
                color="primary"
                onClick={() => copyToClipboard(cognitoLink)}>
                {intl.formatMessage({ id: 'teamMembershipsEmailButton' })}
              </Button>
            </Tooltip>
            <Button
              className={classes.toolbarButton}
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
            teams={getSortedTeams(getFilteredTeams())}
            setTeams={setTeams}
            investibles={getMarketInvestibles()}
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
            investibles={getMarketInvestibles()}
            selectedTeamId={selectedTeamId}
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
  allUsers: getAllUsers(state.usersReducer),
});

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(injectIntl(withUserAndPermissions(withMarketId(withStyles(styles)(UserMemberships)))));
