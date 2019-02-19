import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Grid } from '@material-ui/core';
import _ from 'lodash';
import MemberListItem from './MemberListItem';
import { getClient } from '../../config/uclusionClient';
import { ERROR, sendIntlMessage } from '../../utils/userMessage';
import { withMarketId } from '../PathProps/MarketId';

function MemberList(props) {
  const [users, setUsers] = useState(undefined);
  const { teamId, teamShared, teamSize } = props;
  function processUser(user) {
    const processed = { ...user };
    const { marketId } = props;
    const marketPresence = user.market_presences.find(presence => presence.market_id === marketId);
    processed.quantity = marketPresence.quantity;
    processed.quantityInvested = marketPresence.quantity_invested;
    return processed;
  }
  useEffect(() => {
    const clientPromise = getClient();
    clientPromise.then(client => client.teams.get(teamId)).then((response) => {
      const processedUsers = response.users.map(user => processUser(user));
      const nonUsers = _.remove(processedUsers, user => user.type !== 'USER');
      const teamUser = nonUsers[0]; // Should be only one
      teamShared(teamUser.quantity);
      teamSize(processedUsers.length);
      setUsers(processedUsers);
    }).catch((error) => {
      console.log(error);
      sendIntlMessage(ERROR, { id: 'teamMemberLoadFailed' });
    });
    return () => {};
  }, []);
  return (
    <Grid container spacing={16}>
      {users && users.map(user => <MemberListItem key={user.id} user={user} />)}
    </Grid>
  );
}

MemberList.propTypes = {
  teamId: PropTypes.string.isRequired,
  marketId: PropTypes.string.isRequired,
  teamShared: PropTypes.func.isRequired,
  teamSize: PropTypes.func.isRequired,
};

export default withMarketId(MemberList);
