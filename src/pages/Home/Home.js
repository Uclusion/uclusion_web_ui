import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import Activity from '../../containers/Activity';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { getMarketDetailsForType } from '../../contexts/MarketsContext/marketsContextHelper';
import PlanningDialogs from './PlanningDialogs';
import Notifications from '../../components/Notifications/Notifications';
function Home(props) {
  const { hidden } = props;
  const [marketsState] = useContext(MarketsContext);
  const planningDetails = getMarketDetailsForType(marketsState, 'DECISION');
  //const decisionDetails = getMarketDetailsForType(marketsState, 'DECISION');
  return (
    <Activity
      title="Home"
      pageTitle="PageTitle"
      hidden={hidden}
      appBarContent={<Notifications />}
    >
      <PlanningDialogs markets={planningDetails} />
    </Activity>
  )

}

Home.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default Home;
