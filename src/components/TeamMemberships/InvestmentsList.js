import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import InvestmentsListItem from './InvestmentsListItem';
import { getClient } from '../../config/uclusionClient';
import { ERROR, sendIntlMessage } from '../../utils/userMessage';
import { withMarketId } from '../PathProps/MarketId';
import _ from 'lodash';

function InvestmentsList(props) {
  const [investments, setInvestments] = useState(undefined);
  const {
    userId,
    user,
    investibles,
    setTeams,
  } = props;
  useEffect(() => {
    const clientPromise = getClient();
    clientPromise.then((client) => {
      console.log(`User ID is ${userId} and logged in user ${user.id}`);
      return client.markets.listUserInvestments(userId);
    }).then((response) => {

      setInvestments(response);
    }).catch((error) => {
      console.error(error);
      sendIntlMessage(ERROR, { id: 'investmentsLoadFailed' });
    });
    return () => {};
  }, [userId, user]);
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
          user={user}
          quantity={investment.quantity}
          investible={getInvestible(investment.investible_id)}
          userIsOwner={userId === user.id}
          setTeams={setTeams}
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
  investibles: PropTypes.arrayOf(PropTypes.object),
  setTeams: PropTypes.func, //eslint-disable-line
  user: PropTypes.shape({
    id: PropTypes.string,
  }).isRequired,
};

export default withMarketId(InvestmentsList);
