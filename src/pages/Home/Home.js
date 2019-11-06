import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import Screen from '../../containers/Activity/Screen';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { getMarketDetailsForType } from '../../contexts/MarketsContext/marketsContextHelper';
import PlanningDialogs from './PlanningDialogs';
import SubSection from '../../containers/SubSection/SubSection';
import { useIntl } from 'react-intl';
import Notifications from '../../components/Notifications/Notifications';
import DecisionDialogs from './DecisionDialogs';

function Home(props) {
  const { hidden } = props;
  const intl = useIntl();
  const [marketsState] = useContext(MarketsContext);
  const planningDetails = getMarketDetailsForType(marketsState, 'PLANNING');
  const decisionDetails = getMarketDetailsForType(marketsState, 'DECISION');
  return (
    <Screen
      title={<img src="/images/Uclusion_Wordmark_Color.png" alt="Uclusion"/>}
      hidden={hidden}
      appBarContent={<Notifications />}
    >
      <SubSection
        title={intl.formatMessage({ id: 'homeSubsectionPlanning' })}
      >
        <PlanningDialogs markets={planningDetails} />
      </SubSection>
      <SubSection
        title={intl.formatMessage({ id: 'homeSubsectionDecision' })}
      >
        <DecisionDialogs markets={decisionDetails} />
      </SubSection>
    </Screen>
  );

}

Home.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default Home;
