import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core';
import Screen from '../../containers/Screen/Screen';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { getMarketDetailsForType } from '../../contexts/MarketsContext/marketsContextHelper';
import PlanningDialogs from './PlanningDialogs';
import SubSection from '../../containers/SubSection/SubSection';
import Notifications from '../../components/Notifications/Notifications';
import DecisionDialogs from './DecisionDialogs';
import DecisionAdd from './DecisionAdd';
import DecisionAddActionButton from './DecisionAddActionButton';
import PlanningAdd from './PlanningAdd';
import PlanningAddActionButton from './PlanningAddActionButton';
import InitiativeAddActionButton from './InitiativeAddActionButton';


const useStyles = makeStyles(() => {
  return {
    breadCrumbImage: {
      height: 40,
    },
  };
});

function Home(props) {
  const { hidden } = props;
  const classes = useStyles();
  const [marketsState] = useContext(MarketsContext);
  const planningDetails = getMarketDetailsForType(marketsState, 'PLANNING');
  const decisionDetails = getMarketDetailsForType(marketsState, 'DECISION');

  const [planningAddMode, setPlanningAddMode] = useState(false);
  const [decisionAddMode, setDecisionAddMode] = useState(false);

  function toggleDecisionAddMode() {
    setDecisionAddMode(!decisionAddMode);
  }

  function togglePlanningAddMode() {
    setPlanningAddMode(!planningAddMode);
  }

  const sidebarActions = [];
  if (!planningAddMode || decisionAddMode) {
    sidebarActions.push(<PlanningAddActionButton key="planningAdd" onClick={togglePlanningAddMode}/>);
    sidebarActions.push(<DecisionAddActionButton key="decisionAdd" onClick={toggleDecisionAddMode}/>);
    sidebarActions.push(<InitiativeAddActionButton key="initiativeAdd" onClick={() => {}}/>);
  }

  function getContents() {
    if (planningAddMode) {
      return (
        <PlanningAdd
          onCancel={togglePlanningAddMode}
          onSave={togglePlanningAddMode}
        />
      );
    }
    if (decisionAddMode) {
      return (
        <DecisionAdd
          onCancel={toggleDecisionAddMode}
          onSave={toggleDecisionAddMode}
        />
      );
    }
    return (
      <>
        <SubSection>
          <PlanningDialogs markets={planningDetails}/>
        </SubSection>
        <SubSection>
          <DecisionDialogs markets={decisionDetails}/>
        </SubSection>
      </>
    );
  }

  return (
    <Screen
      title={<img src="/images/Uclusion_Wordmark_Color.png" alt="Uclusion" className={classes.breadCrumbImage}/>}
      hidden={hidden}
      sidebarActions={sidebarActions}
      appBarContent={<Notifications/>}
    >
      {getContents()}
    </Screen>
  );

}

Home.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default Home;
