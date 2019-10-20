import React, { useContext, useEffect, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import VotingCertainty from './VotingCertainty';
import VoteMark from './VoteMark';
import { updateInvestment } from '../../api/marketInvestibles';
import { AsyncMarketPresencesContext } from '../../contexts/AsyncMarketPresencesContext';
import useAsyncMarketContext from '../../contexts/useAsyncMarketsContext';

const SAVE_DELAY = 1000;

function Voting(props) {
  const { investible, marketId, investmentEnabled } = props;
  const { investible: coreInvestible } = investible;
  const { id } = coreInvestible;
  const { getCurrentUserInvestment } = useContext(AsyncMarketPresencesContext);
  const [investment, setInvestment] = useState(undefined);
  const { getCurrentUser } = useAsyncMarketContext();
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
      getCurrentUser().then((currentUser) => getCurrentUserInvestment(id, marketId, currentUser))
        .then((userInvestment) => setInvestment(userInvestment));
    }
  }, [id, marketId, getCurrentUserInvestment, getCurrentUser]);

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
