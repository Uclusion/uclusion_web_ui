import React, { useContext, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import VotingCertainty from './VotingCertainty';
import VoteMark from './VoteMark';
import { updateInvestment } from '../../api/marketInvestibles';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { getMyUserForMarket } from '../../contexts/MarketsContext/marketsContextHelper';
import { getCurrentUserInvestment } from '../../contexts/MarketPresencesContext/marketPresencesHelper';

const SAVE_DELAY = 1000;

function Voting(props) {
  const { investible, marketId, investmentEnabled } = props;
  const { id } = investible;
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [marketsState] = useContext(MarketsContext);
  const currentUser = getMyUserForMarket(marketsState, marketId);
  const currentInvestment = getCurrentUserInvestment(marketPresencesState, id, marketId, currentUser);
  const [investment, setInvestment] = useState(currentInvestment);


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
