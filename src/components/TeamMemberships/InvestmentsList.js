import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import InvestmentsListItem from './InvestmentsListItem';
import { getClient } from '../../config/uclusionClient';
import { ERROR, sendIntlMessage } from '../../utils/userMessage';
import { withMarketId } from '../PathProps/MarketId';

function InvestiblesList(props) {
  const [investments, setInvestments] = useState(undefined);
  const { userId, marketId, investibles } = props;
  useEffect(() => {
    const clientPromise = getClient();
    clientPromise.then((client) => {
      // TODO pagination with lastEvaluatedKey
      return client.markets.listUserInvestments(marketId, userId, 100);
    }).then((response) => {
      setInvestments(response);
    }).catch((error) => {
      console.log(error);
      sendIntlMessage(ERROR, { id: 'investmentsLoadFailed' });
    });
    return () => {};
  }, [userId]);
  function getInvestible(typeObjectId) {
    return investibles.find(({ id }) => id in typeObjectId);
  }
  return (
    investments && investibles && investments.map(investment => (
      <InvestmentsListItem
        key={investment.type_object_id}
        quantity={investment.quantity}
        investible={getInvestible(investment.type_object_id)}
      />
    ))
  );
}

InvestiblesList.propTypes = {
  userId: PropTypes.string.isRequired,
  marketId: PropTypes.string.isRequired,
  investibles: PropTypes.arrayOf(PropTypes.object),
};

export default withMarketId(InvestiblesList);
