/* eslint-disable react/forbid-prop-types */
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import Activity from '../../containers/Activity/Activity';
import { withUserAndPermissions } from '../../components/UserPermissions/UserPermissions';
import { getClient } from '../../config/uclusionClient';
import { ERROR, sendIntlMessage } from '../../utils/userMessage';
import { withMarketId } from '../../components/PathProps/MarketId';
import InviteListItem from './InviteListItem';
import TeamAdd from './TeamAdd';

function Invite(props) {
  const [teams, setTeams] = useState([]);
  const { intl, userPermissions, marketId } = props;
  const { canListAccountTeams } = userPermissions;

  useEffect(() => {
    const clientPromise = getClient();
    if (canListAccountTeams) {
      clientPromise.then(client => client.teams.list(marketId)).then((marketTeams) => {
        setTeams(marketTeams.filter(team => !('external_id' in team)));
      }).catch((error) => {
        console.log(error);
        sendIntlMessage(ERROR, { id: 'teamsLoadFailed' });
      });
    } else {
      clientPromise.then(client => client.teams.mine(marketId)).then((marketTeams) => {
        setTeams(marketTeams.filter(team => !('external_id' in team)));
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
      title={intl.formatMessage({ id: 'inviteHeader' })}
    >
      <TeamAdd marketId={marketId} teams={teams} teamsSet={setTeams} />
      {teams.map(team => (
        <InviteListItem
          key={team.id}
          name={team.name}
          description={team.description}
          teamSize={team.team_size}
        />
      ))}
    </Activity>
  );
}

Invite.propTypes = {
  userPermissions: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired,
  intl: PropTypes.object.isRequired,
};

export default injectIntl(withUserAndPermissions(withMarketId(Invite)));
