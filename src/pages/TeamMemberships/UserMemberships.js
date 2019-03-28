/* eslint-disable react/forbid-prop-types */
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { getInvestibles } from '../../store/MarketInvestibles/reducer';
import Activity from '../../containers/Activity/Activity';
import UserMembershipsList from '../../components/TeamMemberships/UserMembershipsList';
import { withUserAndPermissions } from '../../components/UserPermissions/UserPermissions';
import { getClient } from '../../config/uclusionClient';
import { ERROR, sendIntlMessage } from '../../utils/userMessage';
import { withMarketId } from '../../components/PathProps/MarketId';
import InvestibleDetail from '../../components/Investibles/InvestibleDetail';
import UserDetail from '../../components/TeamMemberships/UserDetail';

function UserMemberships(props) {
  const [teams, setTeams] = useState(undefined);
  const [allUsers, setAllUsers] = useState({});
  const {
    intl,
    userPermissions,
    marketId,
    investibles,
    history,
  } = props;
  const { canListAccountTeams } = userPermissions;
  const { location: { hash, pathname } } = history;

  function getMarketInvestibles() {
    const { marketId, investibles } = props;
    if (marketId in investibles) {
      return investibles[marketId];
    }

    return undefined;
  }

  function usersFetched(users) {
    const newUsers = { ...allUsers };
    users.forEach((user) => {
      newUsers[user.id] = user;
    });
    setAllUsers(newUsers);
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

  let investibleDetail = null;
  let userDetail = null;
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
      }
    }
  }

  return (
    <Activity
      isLoading={teams === undefined}
      containerStyle={{ overflow: 'hidden' }}
      title={intl.formatMessage({ id: 'teamsHeader' })}
    >
      {teams && (
        <UserMembershipsList
          teams={teams}
          investibles={getMarketInvestibles()}
          usersFetched={usersFetched}
        />
      )}
      {investibleDetail && (
        <InvestibleDetail
          investible={investibleDetail}
          onClose={() => history.push(pathname)}
        />
      )}
      {userDetail && (
        <UserDetail
          user={userDetail}
          investibles={getMarketInvestibles()}
          onClose={() => history.push(pathname)}
        />
      )}
    </Activity>
  );
}

UserMemberships.propTypes = {
  userPermissions: PropTypes.object.isRequired,
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
)(injectIntl(withUserAndPermissions(withMarketId(UserMemberships))));
