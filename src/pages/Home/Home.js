import React, { useContext } from 'react';
import { useHistory } from 'react-router';
import config from '../../config';
import PropTypes from 'prop-types';
import _ from 'lodash';
import MenuBookIcon from '@material-ui/icons/MenuBook';
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
import {
  INITIATIVE_TYPE,
  DECISION_TYPE,
  PLANNING_TYPE,
} from '../../constants/markets';
import InitiativeDialogs from './InitiativeDialogs';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { navigate } from '../../utils/marketIdPathFunctions';
import { getDialogTypeIcon } from '../../components/Dialogs/dialogIconFunctions';
import HomeCheatSheet from './HomeCheatSheet';
import UclusionTour from '../../components/Tours/UclusionTour';
import { PURE_SIGNUP_FAMILY_NAME, PURE_SIGNUP_HOME, pureSignupHomeSteps } from '../../components/Tours/pureSignupTours';
import { CognitoUserContext } from '../../contexts/CongitoUserContext';
import { AccountContext } from '../../contexts/AccountContext/AccountContext';
import { canCreate } from '../../contexts/AccountContext/accountContextHelper';
import SearchBox from '../../components/Search/SearchBox';

function Home(props) {
  const { hidden } = props;
  const history = useHistory();
  const cognitoUser = useContext(CognitoUserContext);
  const [accountState] = useContext(AccountContext);
  const accountCanCreate = canCreate(accountState);
  const intl = useIntl();
  const [marketsState] = useContext(MarketsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);

  const createEnabled = !config.payments.enabled || accountCanCreate;

  const myNotHiddenMarketsState = getNotHiddenMarketDetailsForUser(
    marketsState,
    marketPresencesState,
  );
  const planningDetails = _.sortBy(getMarketDetailsForType(
    myNotHiddenMarketsState,
    PLANNING_TYPE,
  ), 'created_at').reverse();
  const decisionDetails = _.sortBy(getMarketDetailsForType(
    myNotHiddenMarketsState,
    DECISION_TYPE,
  ), 'created_at').reverse();
  const initiativeDetails = _.sortBy(getMarketDetailsForType(
    myNotHiddenMarketsState,
    INITIATIVE_TYPE,
  ), 'created_at').reverse();

  function addInitiative() {
    navigate(history, '/dialogAdd#type=INITIATIVE');
  }

  function addDecision() {
    navigate(history, '/dialogAdd#type=DECISION');
  }

  function addPlanning() {
    navigate(history, '/dialogAdd#type=PLANNING');
  }
  const noMarkets = _.isEmpty(planningDetails) && _.isEmpty(decisionDetails) && _.isEmpty(initiativeDetails);
  const tourSteps = pureSignupHomeSteps({ name: cognitoUser.name });

  const CREATE_ACTIONS = [
    {
    label: intl.formatMessage({ id: 'homeAddPlanningExplanation' }),
    openLabel: intl.formatMessage({ id: 'homeAddPlanning' }),
    icon: getDialogTypeIcon(PLANNING_TYPE),
    onClick: () => addPlanning(),
  },
    {
      label: intl.formatMessage({ id: 'homeAddDecisionExplanation' }),
      openLabel: intl.formatMessage({ id: 'homeAddDecision' }),
      icon: getDialogTypeIcon(DECISION_TYPE),
      id: 'createDialog',
      onClick: () => addDecision(),
    },
    {
      label: intl.formatMessage({ id: 'homeAddInitiativeExplanation' }),
      openLabel: intl.formatMessage({ id: 'homeAddInitiative' }),
      icon: getDialogTypeIcon(INITIATIVE_TYPE),
      onClick: () => addInitiative(),
    },
  ];

  const VIEW_ACTIONS = [
    {
      label: intl.formatMessage({ id: 'homeViewArchivesExplanation' }),
      openLabel: intl.formatMessage({ id: 'homeViewArchives' }),
      icon: <MenuBookIcon/>,
      onClick: () => navigate(history, '/archives'),
    }
  ];

  const SIDEBAR_ACTIONS = createEnabled? CREATE_ACTIONS.concat(VIEW_ACTIONS) : VIEW_ACTIONS;

  const sidebarActions = [];

  SIDEBAR_ACTIONS.forEach((action, index) => {
    sidebarActions.push(
      <ExpandableSidebarAction
        id={action.id}
        key={index}
        icon={action.icon}
        label={action.label}
        openLabel={action.openLabel}
        onClick={action.onClick}
      />,
    );
  });

  return (
    <Screen
      title={intl.formatMessage({ 'id': 'homeBreadCrumb' })}
      tabTitle={intl.formatMessage({ id: 'homeBreadCrumb' })}
      hidden={hidden}
      isHome
      sidebarActions={sidebarActions}
    >
      <UclusionTour
        hidden={hidden}
        family={PURE_SIGNUP_FAMILY_NAME}
        name={PURE_SIGNUP_HOME}
        steps={tourSteps}
        continuous
        hideBackButton
      />
      {noMarkets && (
        <HomeCheatSheet/>
      )}
      {!noMarkets && (
        <React.Fragment>
          <SearchBox/>
          <PlanningDialogs markets={planningDetails}/>
          <DecisionDialogs markets={decisionDetails}/>
          <InitiativeDialogs markets={initiativeDetails}/>
        </React.Fragment>
      )}
    </Screen>
  );
}

Home.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default Home;
