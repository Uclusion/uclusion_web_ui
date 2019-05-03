import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import InvestmentsListItem from './InvestmentsListItem';
import { getClient } from '../../config/uclusionClient';
import { ERROR, sendIntlMessage } from '../../utils/userMessage';
import { withMarketId } from '../PathProps/MarketId';
import { withUserAndPermissions } from '../UserPermissions/UserPermissions';
import _ from 'lodash';

function InvestmentsList(props) {
  const [investments, setInvestments] = useState(undefined);
  const {
    userId,
    marketId,
    investibles,
    upUser,
    teams,
    setTeams,
    users,
    setUsers,
  } = props;
  useEffect(() => {
    const clientPromise = getClient();
    clientPromise.then((client) => {
      console.log(`User ID is ${userId} and logged in user ${upUser.id}`);
      return client.markets.listUserInvestments(marketId, userId);
    }).then((response) => {

      setInvestments(response);
    }).catch((error) => {
      console.error(error);
      sendIntlMessage(ERROR, { id: 'investmentsLoadFailed' });
    });
    return () => {};
  }, [userId]);
  function getInvestible(investibleId) {
    return investibles.find(({ id }) => id === investibleId);
  }

  function getSortedInvestments() {
    if (!investments || investments.length === 0) {
      return [];
    }
    const cloned = [...investments];
    const sorted = _.sortBy(cloned, ['updated_at', 'id']);
    return sorted;
  }

  const sortedInvestments = getSortedInvestments();
  // we can't render an investment if we don't have the investible.
  // this can happen if we haven't loaded the investibles yet
  const filteredInvestments = investibles? sortedInvestments.filter(investment => getInvestible(investment.investible_id)) : [];

  return (
    <div>
      {investments && investibles && filteredInvestments.map(investment => (
        <InvestmentsListItem
          key={investment.id}
          quantity={investment.quantity}
          investible={getInvestible(investment.investible_id)}
          userIsOwner={userId === upUser.id}
          teams={teams}
          setTeams={setTeams}
          userId={userId}
          users={users}
          setUsers={setUsers}
          createdAt={investment.created_at}
          id={investment.id}
          stageId={investment.stage_id}
        />
      ))}
    </div>
  );
}

InvestmentsList.propTypes = {
  userId: PropTypes.string.isRequired,
  marketId: PropTypes.string.isRequired,
  investibles: PropTypes.arrayOf(PropTypes.object),
  teams: PropTypes.arrayOf(PropTypes.object), //eslint-disable-line
  setTeams: PropTypes.func, //eslint-disable-line
  users: PropTypes.object.isRequired, //eslint-disable-line
  setUsers: PropTypes.func, //eslint-disable-line
  upUser: PropTypes.shape({
    id: PropTypes.string,
  }).isRequired,
};

export default withMarketId(withUserAndPermissions(InvestmentsList));
