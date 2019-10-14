import React, { useEffect, useState } from 'react';
import VotingCertainty from './VotingCertainty';
import VoteMark from './VoteMark';
import { updateInvestment } from '../../api/marketInvestibles';
import useAsyncMarketPresencesContext from '../../contexts/useAsyncMarketPresencesContext';

const SAVE_DELAY = 1500;

function Voting(props) {
  const { investible, marketId, investmentEnabled } = props;
  const { investible: coreInvestible } = investible;
  const { id } = coreInvestible;
  const { getCurrentUserInvestment } = useAsyncMarketPresencesContext();
  const [investment, setInvestment] = useState(undefined);
  const [timer, setTimer] = useState(null);

  useEffect(() => {
    if (id && marketId) {
      getCurrentUserInvestment(id, marketId)
        .then((userInvestment) => setInvestment(userInvestment));
    }
  }, [id, marketId, getCurrentUserInvestment]);

  function save(value) {
    return () => {
      const currentInvestment = investment || 0;
      console.log(`Saving investment of ${value}`);
      return updateInvestment(marketId, id, value, currentInvestment).then(() => {
        setInvestment(value);
      });
    };
  }

  function handleChange(value) {
    clearTimeout(timer);
    // we need to bind the value in the save so that we use the right one after the refresh
    const saveFunc = save(value);
    setTimer(setTimeout(saveFunc, SAVE_DELAY));
  }

  const myInvestment = investment || 0;
  console.debug(myInvestment);
  const invested = myInvestment > 0;

  function onInvestClick() {
    if (myInvestment === 0) {
      return handleChange(50); // middle certainty
    }
    return handleChange(0); // uninvest us
  }

  return (
    <div>
      {id && marketId
      && (<VoteMark onClick={onInvestClick} invested={invested} disabled={!investmentEnabled} />)}
      {invested && <VotingCertainty value={myInvestment} onChange={handleChange} />}
    </div>
  );
}

export default Voting;
