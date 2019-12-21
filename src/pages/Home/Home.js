import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core';
import Screen from '../../containers/Screen/Screen';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import {
  getMarketDetailsForType,
  getNotHiddenMarketDetailsForUser,
} from '../../contexts/MarketsContext/marketsContextHelper';
import PlanningDialogs from './PlanningDialogs';
import SubSection from '../../containers/SubSection/SubSection';
import DecisionDialogs from './DecisionDialogs';
import DecisionAdd from './DecisionAdd';
import DecisionAddActionButton from './DecisionAddActionButton';
import PlanningAdd from './PlanningAdd';
import PlanningAddActionButton from './PlanningAddActionButton';
import InitiativeAddActionButton from './InitiativeAddActionButton';
import { INITIATIVE_TYPE, DECISION_TYPE, PLANNING_TYPE } from '../../constants/markets';
import InitiativeAdd from './InitiativeAdd';
import InitiativeDialogs from './InitiativeDialogs';
import ViewArchiveActionButton from './ViewArchivesActionButton';
import { useIntl } from 'react-intl';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import SidebarMenuButton from '../../components/Buttons/SidebarMenuButton';

const useStyles = makeStyles(() => ({
  breadCrumbImage: {
    height: 40,
  },
}));

const breadCrumbs = [
  {
    title: 'Breadcrumb'
  },
  {
    title: 'Longer Breadcrumb'
  },
];

function Home(props) {
  const { hidden } = props;
  const classes = useStyles();
  const intl = useIntl();
  const [marketsState] = useContext(MarketsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const myNotHiddenMarketsState = getNotHiddenMarketDetailsForUser(marketsState,
    marketPresencesState);
  const planningDetails = getMarketDetailsForType(myNotHiddenMarketsState, PLANNING_TYPE);
  const decisionDetails = getMarketDetailsForType(myNotHiddenMarketsState, DECISION_TYPE);
  const initiativeDetails = getMarketDetailsForType(myNotHiddenMarketsState, INITIATIVE_TYPE);
  const [planningAddMode, setPlanningAddMode] = useState(false);
  const [decisionAddMode, setDecisionAddMode] = useState(false);
  const [initiativeAddMode, setInitiativeAddMode] = useState(false);

  const SIDEBAR_ACTIONS = [
    {
      label: 'Edit',
      icon: 'images/Uclusion_Sidebar_Edit.svg',
      onClick: () => {},
    },
    {
      label: 'New',
      icon: 'images/Uclusion_Sidebar_New.svg',
      onClick: () => {},
    },
    {
      label: 'Information',
      icon: 'images/Uclusion_Sidebar_Info.svg',
      onClick: () => {},
    },
    {
      label: 'Message',
      icon: 'images/Uclusion_Sidebar_Message.svg',
      onClick: () => {},
    },
  ];

  function toggleInitiativeAddMode() {
    setInitiativeAddMode(!initiativeAddMode);
  }

  function toggleDecisionAddMode() {
    setDecisionAddMode(!decisionAddMode);
  }

  function togglePlanningAddMode() {
    setPlanningAddMode(!planningAddMode);
  }

  const sidebarActions = [];
    SIDEBAR_ACTIONS.forEach(action => {
      sidebarActions.push(<SidebarMenuButton icon={action.icon} label={action.label} onClick={action.onClick} />);
    });

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

    if (initiativeAddMode) {
      return (
        <InitiativeAdd
          onCancel={toggleInitiativeAddMode}
          onSave={toggleInitiativeAddMode}
        />
      );
    }
    return (
      <>
        <SubSection>
          <PlanningDialogs markets={planningDetails} />
        </SubSection>
        <SubSection>
          <DecisionDialogs markets={decisionDetails} />
        </SubSection>
        <SubSection>
          <InitiativeDialogs markets={initiativeDetails} />
        </SubSection>
      </>
    );
  }

  return (
    <Screen
      title="Shockingly long breadcrumb to show information"
      tabTitle={intl.formatMessage({ id: 'homeBreadCrumb' })}
      hidden={hidden}
      sidebarActions={sidebarActions}
      breadCrumbs={breadCrumbs}
    >
      {getContents()}
    </Screen>
  );
}

Home.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default Home;
