import React, { useContext, useEffect, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import VotingCertainty from './VotingCertainty';
import VoteMark from './VoteMark';
import { updateInvestment } from '../../api/marketInvestibles';
import { AsyncMarketPresencesContext } from '../../contexts/AsyncMarketPresencesContext';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { getCurrentUser } from '../../contexts/MarketsContext/marketsContextHelper';

const SAVE_DELAY = 1000;

function Voting(props) {
  const { investible, marketId, investmentEnabled } = props;
  const { id } = investible;
  const { getCurrentUserInvestment } = useContext(AsyncMarketPresencesContext);
  const [investment, setInvestment] = useState(undefined);
  const [marketsState] = useContext(MarketsContext);
  const currentUser = getCurrentUser(marketsState);
  function doInvestment(value, currentInvestment) {
    console.log(`Saving investment of ${value} with ${currentInvestment}`);
    return updateInvestment(marketId, id, value, currentInvestment);
  }
  const [debouncedCallback] = useDebouncedCallback(
    (value, currentInvestment) => {
      setInvestment(value);
      doInvestment(value, currentInvestment);
    },
    // delay in ms
    SAVE_DELAY,
  );

  useEffect(() => {
    if (id && marketId) {
      console.debug(`Rerendering use effect for investment for investible ${id}`);
      getCurrentUserInvestment(id, marketId, currentUser)
        .then((userInvestment) => setInvestment(userInvestment));
    }
  }, [id, marketId, getCurrentUserInvestment, currentUser]);

  const myInvestment = investment || 0;
  const invested = myInvestment > 0;

  function onInvestClick() {
    if (myInvestment === 0) {
      return doInvestment(50, 0); // middle certainty
    }
    return doInvestment(0, myInvestment); // uninvest us
  }

  return (
    <div>
      {id && marketId
      && (<VoteMark onClick={onInvestClick} invested={invested} disabled={!investmentEnabled} />)}
      {invested && (
      <VotingCertainty
        value={myInvestment}
        onChange={debouncedCallback}
      />
      )}
    </div>
  );
}

export default Voting;
