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

  let timer = null;
  const invested = investment > 0;
  const investmentChanged = invested !== current_user_investment;

  function save() {
    return updateInvestment(marketId, id, investment, current_user_investment)
      .then((result) => {
        return updateInvestibleLocally({ ...investible, current_user_investment: investment });
      });
  }

  function handleChange(value) {
    clearTimeout(timer);
    if (investmentChanged) {
      setInvestment(value);
      timer = setTimeout(save(), SAVE_DELAY);
    }
  }

  function onInvestClick() {
    if (!invested) {
      return handleChange(10);
    }
    return handleChange(0); // uninvest us
  }

  return (
    <div>
      <VoteMark onClick={onInvestClick} invested={invested} disabled={!investmentEnabled} />
      {invested && <VotingCertainty value={invested} onChange={handleChange} />}
    </div>
  );
}

export default Voting;