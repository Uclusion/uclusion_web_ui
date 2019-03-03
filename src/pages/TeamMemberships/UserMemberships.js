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

function UserMemberships(props) {
  const [teams, setTeams] = useState(undefined);
  const { intl, userPermissions, marketId } = props;
  const { canListAccountTeams } = userPermissions;

  function getMarketInvestibles() {
    const { marketId, investibles } = props;
    if (marketId in investibles) {
      return investibles[marketId];
    }

    return undefined;
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

  return (
    <Activity
      isLoading={teams === undefined}
      containerStyle={{ overflow: 'hidden' }}
      title={intl.formatMessage({ id: 'teamsHeader' })}
    >
      {teams && <UserMembershipsList teams={teams} investibles={getMarketInvestibles()} />}
    </Activity>
  );
}

UserMemberships.propTypes = {
  userPermissions: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired,
  intl: PropTypes.object.isRequired,
  investibles: PropTypes.object,
  marketId: PropTypes.string,
};

const mapStateToProps = state => ({
  investibles: getInvestibles(state.investiblesReducer),
});

export default connect(
  mapStateToProps,
)(injectIntl(withUserAndPermissions(withMarketId(UserMemberships))));
