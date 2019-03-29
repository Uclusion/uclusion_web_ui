import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import InvestmentsListItem from './InvestmentsListItem';
import { getClient } from '../../config/uclusionClient';
import { ERROR, sendIntlMessage } from '../../utils/userMessage';
import { withMarketId } from '../PathProps/MarketId';
import { withUserAndPermissions } from '../UserPermissions/UserPermissions';

function InvestmentsList(props) {
  const [investments, setInvestments] = useState(undefined);
  const {
    userId,
    marketId,
    investibles,
    upUser,
    teams,
    setTeams,
  } = props;
  useEffect(() => {
    const clientPromise = getClient();
    clientPromise.then((client) => {
      console.log(`User ID is ${userId} and logged in user ${upUser.id}`);
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
    return investibles.find(({ id }) => typeObjectId.includes(id));
  }
  return (
    <div>
      {investments && investibles && investments.map(investment => (
        <InvestmentsListItem
          key={investment.type_object_id}
          quantity={investment.quantity}
          investible={getInvestible(investment.type_object_id)}
          userIsOwner={userId === upUser.id}
          teams={teams}
          setTeams={setTeams}
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
  upUser: PropTypes.shape({
    id: PropTypes.string,
  }).isRequired,
};

export default withMarketId(withUserAndPermissions(InvestmentsList));
