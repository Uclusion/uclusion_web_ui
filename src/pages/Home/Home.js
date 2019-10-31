import React, { useContext } from 'react';
import Activity from '../../containers/Activity';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { getMarketDetailsForType } from '../../contexts/MarketsContext/marketsContextHelper';
import PlanningDialogs from './PlanningDialogs';

function Home(props) {
  const { hidden } = props;
  const [marketsState] = useContext(MarketsContext);
  const planningDetails = getMarketDetailsForType(marketsState, 'DECISION');
  const decisionDetails = getMarketDetailsForType(marketsState, 'DECISION');
  return (
    <Activity
      title="Home"
      pageTitle="PageTitle"
      hidden={hidden}
    >
      <PlanningDialogs markets={planningDetails} />
    </Activity>
  )

}

export default Home;