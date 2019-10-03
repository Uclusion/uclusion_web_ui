import React, { useState } from 'react';
import VotingCertainty from './VotingCertainty';
import VoteMark from './VoteMark';
import { updateInvestment } from '../../api/marketInvestibles';
import useAsyncInvestiblesContext from '../../contexts/useAsyncInvestiblesContext';

const SAVE_DELAY = 1500;

function Voting(props) {
  const { investible, marketId, investmentEnabled } = props;
  const { current_user_investment, id } = investible;

  const [investment, setInvestment] = useState(current_user_investment);
  const { updateInvestibleLocally } = useAsyncInvestiblesContext();
  const [timer, setTimer] = useState(null);
  const invested = investment > 0;

  function save(value) {
    return () => {
      console.log(`Saving investment of ${value}`);
      return updateInvestment(marketId, id, value, current_user_investment)
        .then((result) => {
          console.log(result);
          return updateInvestibleLocally({ ...investible, current_user_investment: investment });
        });
    };
  }

  function handleChange(value) {
    setInvestment(value);
    clearTimeout(timer);
    // we need to bind the value in the save so that we use the right one after the refresh
    const saveFunc = save(value);
    setTimer(setTimeout(saveFunc, SAVE_DELAY));
  }

  function onInvestClick() {
    if (current_user_investment === 0) {
      return handleChange(50); // middle certainty
    }
    return handleChange(0); // uninvest us
  }

  return (
    <div>
      <VoteMark onClick={onInvestClick} invested={invested} disabled={!investmentEnabled} />
      {invested && <VotingCertainty value={investment} onChange={handleChange} />}
    </div>
  );
}

export default Voting;
