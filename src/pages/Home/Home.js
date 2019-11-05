import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import Screen from '../../containers/Activity/Screen';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { getMarketDetailsForType } from '../../contexts/MarketsContext/marketsContextHelper';
import PlanningDialogs from './PlanningDialogs';
import SubSection from '../../containers/SubSection/SubSection';

import Notifications from '../../components/Notifications/Notifications';

function Home(props) {
  const { hidden } = props;

  const [marketsState] = useContext(MarketsContext);
  const planningDetails = getMarketDetailsForType(marketsState, 'PLANNING');
  //const decisionDetails = getMarketDetailsForType(marketsState, 'DECISION');
  return (
    <Screen
      title="Home"
      pageTitle="PageTitle"
      hidden={hidden}
      appBarContent={<Notifications />}
    >
      <SubSection
        title='Planning Dialogs'
      >
        <PlanningDialogs markets={planningDetails} />
      </SubSection>
    </Screen>
);

}

Home.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default Home;
