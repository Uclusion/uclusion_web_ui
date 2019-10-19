import React, { useEffect, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import VotingCertainty from './VotingCertainty';
import VoteMark from './VoteMark';
import { updateInvestment } from '../../api/marketInvestibles';
import useAsyncMarketPresencesContext from '../../contexts/useAsyncMarketPresencesContext';

const SAVE_DELAY = 1000;

function Voting(props) {
  const { investible, marketId, investmentEnabled } = props;
  const { investible: coreInvestible } = investible;
  const { id } = coreInvestible;
  const { getCurrentUserInvestment } = useAsyncMarketPresencesContext();
  const [investment, setInvestment] = useState(undefined);
  function doInvestment(value) {
    const currentInvestment = investment || 0;
    console.log(`Saving investment of ${value} with ${currentInvestment}`);
    return updateInvestment(marketId, id, value, currentInvestment);
  }
  const [debouncedCallback] = useDebouncedCallback(
    (value) => {
      setInvestment(value);
      doInvestment(value);
    },
    // delay in ms
    SAVE_DELAY,
  );

  useEffect(() => {
    if (id && marketId) {
      console.debug('Refreshing investment...');
      getCurrentUserInvestment(id, marketId)
        .then((userInvestment) => setInvestment(userInvestment));
    }
  }, [id, marketId, getCurrentUserInvestment]);

  const myInvestment = investment || 0;
  const invested = myInvestment > 0;

  function onInvestClick() {
    if (myInvestment === 0) {
      return doInvestment(50); // middle certainty
    }
    return doInvestment(0); // uninvest us
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
