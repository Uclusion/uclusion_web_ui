import React, { useContext, useState } from 'react';
import { useHistory } from 'react-router';
import PropTypes from 'prop-types';
import _ from 'lodash';
import MenuBookIcon from '@material-ui/icons/MenuBook';
import { makeStyles } from '@material-ui/core';
import { useIntl } from 'react-intl';
import ExpandableSidebarAction from '../../components/SidebarActions/ExpandableSidebarAction';
import Screen from '../../containers/Screen/Screen';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import {
  getMarketDetailsForType,
  getNotHiddenMarketDetailsForUser,
} from '../../contexts/MarketsContext/marketsContextHelper';
import PlanningDialogs from './PlanningDialogs';
import DecisionDialogs from './DecisionDialogs';
import DecisionAdd from './DecisionAdd';
import PlanningAdd from './PlanningAdd';
import {
  INITIATIVE_TYPE,
  DECISION_TYPE,
  PLANNING_TYPE,
} from '../../constants/markets';
import InitiativeAdd from './InitiativeAdd';
import InitiativeDialogs from './InitiativeDialogs';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { navigate } from '../../utils/marketIdPathFunctions';
import { getDialogTypeIcon } from '../../components/Dialogs/dialogIconFunctions';

const useStyles = makeStyles(() => ({
  breadCrumbImage: {
    height: 40,
  },
}));

function Home(props) {
  const { hidden } = props;
  const history = useHistory();
  const intl = useIntl();
  const classes = useStyles();
  const [marketsState] = useContext(MarketsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const myNotHiddenMarketsState = getNotHiddenMarketDetailsForUser(
    marketsState,
    marketPresencesState,
  );
  const planningDetails = _.sortBy(getMarketDetailsForType(
    myNotHiddenMarketsState,
    PLANNING_TYPE,
  ), 'created_at');
  const decisionDetails = _.sortBy(getMarketDetailsForType(
    myNotHiddenMarketsState,
    DECISION_TYPE,
  ), 'created_at');
  const initiativeDetails = _.sortBy(getMarketDetailsForType(
    myNotHiddenMarketsState,
    INITIATIVE_TYPE,
  ), 'created_at');
  const [planningAddMode, setPlanningAddMode] = useState(false);
  const [decisionAddMode, setDecisionAddMode] = useState(false);
  const [initiativeAddMode, setInitiativeAddMode] = useState(false);

  function toggleInitiativeAddMode() {
    setInitiativeAddMode(!initiativeAddMode);
  }

  function toggleDecisionAddMode() {
    setDecisionAddMode(!decisionAddMode);
  }

  function togglePlanningAddMode() {
    setPlanningAddMode(!planningAddMode);
  }

  const SIDEBAR_ACTIONS = [
    {
      label: intl.formatMessage({ id: 'homeAddPlanning' }),
      icon: getDialogTypeIcon(PLANNING_TYPE),
      onClick: () => togglePlanningAddMode(),
    },
    {
      label: intl.formatMessage({ id: 'homeAddDecision' }),
      icon: getDialogTypeIcon(DECISION_TYPE),
      onClick: () => toggleDecisionAddMode(),
    },
    {
      label: intl.formatMessage({ id: 'homeAddInitiative' }),
      icon: getDialogTypeIcon(INITIATIVE_TYPE),
      onClick: () => toggleInitiativeAddMode(),
    },
    {
      label: intl.formatMessage({ id: 'homeViewArchives' }),
      icon: <MenuBookIcon />,
      onClick: () => navigate(history, '/archives'),
    },
  ];

  const sidebarActions = [];
  SIDEBAR_ACTIONS.forEach((action, index) => {
    sidebarActions.push(
      <ExpandableSidebarAction
        key={index}
        icon={action.icon}
        label={action.label}
        onClick={action.onClick}
      />,
    );
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
          <PlanningDialogs markets={planningDetails} />
          <DecisionDialogs markets={decisionDetails} />
          <InitiativeDialogs markets={initiativeDetails} />
      </>
    );
  }

  return (
    <Screen
      title={<img src="/images/Uclusion_Wordmark_Color.png" alt="Uclusion" className={classes.breadCrumbImage} />}
      tabTitle={intl.formatMessage({ id: 'homeBreadCrumb' })}
      hidden={hidden}
      sidebarActions={sidebarActions}
    >
      {getContents()}
    </Screen>
  );
}

Home.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default Home;
