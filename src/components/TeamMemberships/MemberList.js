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
  const [investments, setInvestments] = useState(undefined);
  const { teamId, investibles = [], marketId } = props;

  function processUser(user) {
    const processed = { ...user };
    const marketPresence = user.market_presences.find(presence => presence.market_id === marketId);
    processed.quantity = marketPresence.quantity;
    processed.quantityInvested = marketPresence.quantity_invested;
    return processed;
  }

  function processInvestment(investibleId, investmentInfo) {
    // TODO hook to store for full investible
    return { lastInvestmentDate: investmentInfo.most_recent_investment_date };
  }

  function getInvestiblesForUser(user) {
    const investiblesForUser = investibles.filter(({ created_by }) => created_by === user.id);
    return investiblesForUser;
  }

  useEffect(() => {
    let globalClient;
    const clientPromise = getClient();
    clientPromise.then((client) => {
      globalClient = client;
      return client.teams.get(teamId);
    }).then((response) => {
      const processedUsers = response.users.map(user => processUser(user));
      _.remove(processedUsers, user => user.type !== 'USER');
      setUsers(processedUsers);
      return globalClient.teams.investments(teamId, marketId);
    }).then((investmentsDict) => {
      const processedInvestments = [];
      Object.keys(investmentsDict).forEach((investibleId) => {
        const investment = processInvestment(investibleId, investmentsDict[investibleId]);
        processedInvestments.push(investment);
      });
      if (processedInvestments.length > 0) {
        setInvestments(processedInvestments);
      }
    }).catch((error) => {
      console.log(error);
      console.log(investments); // Just to prevent compiler warning for now
      sendIntlMessage(ERROR, { id: 'teamMemberLoadFailed' });
    });
    return () => {};
  }, [marketId]);

  return (
    <Grid container spacing={16}>
      {users && users.map(user => (
        <MemberListItem
          key={user.id}
          user={user}
          investibles={getInvestiblesForUser(user)}
        />
      ))}
    </Grid>
  );
}

MemberList.propTypes = {
  teamId: PropTypes.string.isRequired,
  investibles: PropTypes.arrayOf(PropTypes.object),
  marketId: PropTypes.string.isRequired,
};

export default withMarketId(MemberList);
