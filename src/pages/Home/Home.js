import React, { useContext, useEffect, useState } from 'react'
import { useHistory } from 'react-router';
import PropTypes from 'prop-types'
import _ from 'lodash'
import MenuBookIcon from '@material-ui/icons/MenuBook'
import { useMediaQuery, useTheme } from '@material-ui/core'
import { FormattedMessage, useIntl } from 'react-intl'
import Screen from '../../containers/Screen/Screen'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import {
  getHiddenMarketDetailsForUser,
  getMarketDetailsForType,
  getNotHiddenMarketDetailsForUser
} from '../../contexts/MarketsContext/marketsContextHelper'
import PlanningDialogs from './PlanningDialogs'
import { DECISION_TYPE, INITIATIVE_TYPE, PLANNING_TYPE, } from '../../constants/markets'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import {
  baseNavListItem,
  navigate
} from '../../utils/marketIdPathFunctions'
import { getAndClearRedirect } from '../../utils/redirectUtils'
import InitiativesAndDialogs from './InitiativesAndDialogs'
import { canCreate } from '../../contexts/AccountContext/accountContextHelper';
import UpgradeBanner from '../../components/Banners/UpgradeBanner';
import { AccountContext } from '../../contexts/AccountContext/AccountContext';
import {
  hasInitializedGlobalVersion, hasLoadedGlobalVersion
} from '../../contexts/VersionsContext/versionsContextHelper'
import { VersionsContext } from '../../contexts/VersionsContext/VersionsContext'
import AddIcon from '@material-ui/icons/Add'
import AgilePlanIcon from '@material-ui/icons/PlaylistAdd'
import PlaylistAddCheckIcon from '@material-ui/icons/PlaylistAddCheck'
import HomeIcon from '@material-ui/icons/Home'
import GavelIcon from '@material-ui/icons/Gavel'
import PollIcon from '@material-ui/icons/Poll'
import { SearchResultsContext } from '../../contexts/SearchResultsContext/SearchResultsContext'
import { INVITED_USER_WORKSPACE } from '../../contexts/TourContext/tourContextHelper'
import { TourContext } from '../../contexts/TourContext/TourContext'
import { startTour } from '../../contexts/TourContext/tourContextReducer'
import InvestiblesByWorkspace from '../Dialog/Planning/InvestiblesByWorkspace'
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import { getInvestiblesInStage, getMarketInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper'
import {
  getBlockedStage,
  getRequiredInputStage,
  getStages
} from '../../contexts/MarketStagesContext/marketStagesContextHelper'
import { getUserInvestibles } from '../Dialog/Planning/userUtils'
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'
import SpinningIconLabelButton from '../../components/Buttons/SpinningIconLabelButton'
import { getPageReducerPage, usePageStateReducer } from '../../components/PageState/pageStateHooks'
import StoryWorkspaceWizard from '../../components/AddNew/Workspace/StoryWorkspace/StoryWorkspaceWizard'
import DialogWizard from '../../components/AddNew/Dialog/DialogWizard'
import InitiativeWizard from '../../components/AddNew/Initiative/InitiativeWizard'
import WizardSelector from '../../components/AddNew/WizardSelector'

function Home(props) {
  const { hidden } = props;
  const history = useHistory();
  const intl = useIntl();
  const theme = useTheme();
  const midLayout = useMediaQuery(theme.breakpoints.down('md'));
  const [searchResults] = useContext(SearchResultsContext);
  const [marketsState] = useContext(MarketsContext);
  const [accountState] = useContext(AccountContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [marketStagesState] = useContext(MarketStagesContext)
  const [investiblesState] = useContext(InvestiblesContext)
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const [wizardActive, setWizardActive] = useState(false);
  const [, tourDispatch] = useContext(TourContext);
  const [versionsContext] = useContext(VersionsContext);
  const createEnabled = canCreate(accountState);
  //While fore ground loads there is no global version and operation is running
  const loadingForeGroundMarkets = !hasLoadedGlobalVersion(versionsContext) || marketsState.initializing ||
    (!hasInitializedGlobalVersion(versionsContext) && operationRunning);
  const banner = loadingForeGroundMarkets || createEnabled ? undefined : <UpgradeBanner/>
  const [pageStateFull, pageDispatch] = usePageStateReducer('home');
  const [pageState, updatePageState, pageStateReset] = getPageReducerPage(pageStateFull, pageDispatch, 'config',
    {chosenPerson: { name: '', email: '', external_id: '' }});
  const {
    chosenPerson,
    sectionOpen
  } = pageState;

  useEffect(() => {
    const redirect = getAndClearRedirect()
    if (!_.isEmpty(redirect) && redirect !== '/') {
      // Go ahead and start the invite tour - if they have taken already it's harmless
      tourDispatch(startTour(INVITED_USER_WORKSPACE))
      console.log(`Redirecting you to ${redirect}`)
      history.push(redirect)
    }
  })

  const myNotHiddenMarketsState = getNotHiddenMarketDetailsForUser(marketsState, marketPresencesState, searchResults);
  const planningDetails = getMarketDetailsForType(myNotHiddenMarketsState, marketPresencesState, PLANNING_TYPE) || [];
  const decisionDetails = _.sortBy(getMarketDetailsForType(myNotHiddenMarketsState, marketPresencesState,
    DECISION_TYPE), 'created_at').reverse();
  const initiativeDetails = _.sortBy(getMarketDetailsForType(myNotHiddenMarketsState, marketPresencesState,
    INITIATIVE_TYPE), 'created_at').reverse();

  function onWizardFinish (formData) {
    const { link } = formData;
    setWizardActive(false);
    setOperationRunning(false);
    navigate(history, link);
  }

  const { search } = searchResults;
  const noActiveNonSupportMarkets = _.isEmpty(planningDetails) && _.isEmpty(decisionDetails)
    && _.isEmpty(initiativeDetails.filter((initiative) => {
      const { market_sub_type: marketSubType } = initiative;
      return marketSubType !== 'REQUIREMENTS';
    }));
  const defaultSection = noActiveNonSupportMarkets ? 'planningMarkets' : 'storiesSection';

  function isSectionOpen(section) {
    return sectionOpen === section || !_.isEmpty(search) || midLayout || (!sectionOpen && section === defaultSection);
  }

  function getNavListItemOnClick(subSection, target) {
    return () => {
      updatePageState({sectionOpen: subSection});
      window.scrollTo(0, 0);
    };
  }

  function isSectionBold(section) {
    return (sectionOpen === section || (!sectionOpen && section === defaultSection)) && _.isEmpty(search);
  }

  function createNavListItem(icon, textId, anchorId, howManyNum) {
    const nav = baseNavListItem('/', icon, textId, anchorId, howManyNum, true);
    if (nav.target) {
      nav['onClickFunc'] = getNavListItemOnClick(anchorId, nav.target);
    }
    if (isSectionBold(anchorId)) {
      nav['isBold'] = true;
    }
    return nav;
  }

  const workspacesData = planningDetails.map((market) => {
    const marketPresences = getMarketPresences(marketPresencesState, market.id)
    const myPresence = marketPresences && marketPresences.find((presence) => {
      return presence.external_id === chosenPerson.external_id
    })
    const presence = myPresence || {}
    const investibles = getMarketInvestibles(investiblesState, market.id, searchResults);
    const requiresInputStage = getRequiredInputStage(marketStagesState, market.id) || {};
    const requiresInputInvestibles = getInvestiblesInStage(investibles, requiresInputStage.id) || [];
    const inBlockingStage = getBlockedStage(marketStagesState, market.id) || {};
    const blockedInvestibles = getInvestiblesInStage(investibles, inBlockingStage.id) || [];
    const visibleStages = getStages(marketStagesState, market.id).filter((stage) => stage.appears_in_context)
      || []
    const visibleCountedStages = getStages(marketStagesState, market.id).filter((stage) => stage.appears_in_context &&
        (!_.isEmpty(search) || !stage.appears_in_market_summary))
      || []
    const visibleStageIds = visibleStages.map((stage) => stage.id)
    const visibleCountedStageIds = visibleCountedStages.map((stage) => stage.id)
    const myInvestibles = getUserInvestibles(
      presence.id,
      market.id,
      investibles,
      visibleStageIds,
      searchResults
    ) || []
    const myCountedInvestibles = getUserInvestibles(
      presence.id,
      market.id,
      investibles,
      visibleCountedStageIds,
      searchResults
    ) || []
    return { market, myInvestibles, myCountedInvestibles, presence, requiresInputInvestibles, blockedInvestibles }
  });
  const assignedSize = workspacesData.reduce((accumulator, currentValue) =>
    accumulator + currentValue.myCountedInvestibles.length + currentValue.blockedInvestibles.length +
    currentValue.requiresInputInvestibles.length, 0)
  const archiveMarkets = getHiddenMarketDetailsForUser(marketsState, marketPresencesState, searchResults);

  const navigationMenu = {
    navHeaderIcon: HomeIcon, navToolLink: 'https://documentation.uclusion.com/overview', showSearchResults: true,
    navListItemTextArray: [
      createNavListItem(AgilePlanIcon, 'homeAssignments', 'storiesSection', assignedSize),
      createNavListItem(PlaylistAddCheckIcon, 'planningMarkets', 'planningMarkets', _.size(planningDetails)),
      createNavListItem(GavelIcon, 'dialogs', 'dialogs', _.size(decisionDetails)),
      createNavListItem(PollIcon, 'initiatives', 'initiatives', _.size(initiativeDetails))
    ]
  };

  return (
    <Screen
      title={intl.formatMessage({ 'id': 'homeBreadCrumb' })}
      tabTitle={intl.formatMessage({ id: 'homeBreadCrumb' })}
      hidden={hidden}
      isHome
      banner={banner}
      loading={loadingForeGroundMarkets}
      navigationOptions={banner ? [] : navigationMenu}
    >
      {midLayout && (
        <WizardSelector
          hidden={!wizardActive && !noActiveNonSupportMarkets}
          onFinish={onWizardFinish}
          showCancel={!noActiveNonSupportMarkets}
          onCancel={() => setWizardActive(false)}/>
      )}
      {(wizardActive || noActiveNonSupportMarkets) && !midLayout && isSectionOpen('planningMarkets') && (
        <StoryWorkspaceWizard onStartOver={() => setWizardActive(false)}
                              onFinish={onWizardFinish} isHome showCancel={!noActiveNonSupportMarkets}/>
      )}
      {wizardActive && isSectionOpen('dialogs') && !midLayout && (
        <DialogWizard onStartOver={() => setWizardActive(false)} onFinish={onWizardFinish} isHome />
      )}
      {wizardActive && isSectionOpen('initiatives') && !midLayout && (
        <InitiativeWizard onStartOver={() => setWizardActive(false)} onFinish={onWizardFinish} isHome />
      )}
      {(midLayout || !isSectionOpen('storiesSection')) && !wizardActive && (
        <div style={{ display: 'flex', marginBottom: '2rem' }}>
          {createEnabled && (
            <SpinningIconLabelButton icon={AddIcon} onClick={() => setWizardActive(true)} doSpin={false}>
              <FormattedMessage id={'addNew'}/>
            </SpinningIconLabelButton>
          )}
          {_.size(archiveMarkets) > 0 && (
            <SpinningIconLabelButton icon={MenuBookIcon} onClick={() => navigate(history, '/archives')}
                                     doSpin={false}>
              <FormattedMessage id={'homeViewArchives'}/>
            </SpinningIconLabelButton>
          )}
        </div>
      )}
      {!wizardActive && (
        <InvestiblesByWorkspace workspaces={planningDetails} pageState={pageState} updatePageState={updatePageState}
                                workspacesData={workspacesData} assignedSize={assignedSize}
                                pageStateReset={pageStateReset} isSectionOpen={isSectionOpen} />
      )}
      {!_.isEmpty(planningDetails) && !wizardActive && (
        <PlanningDialogs markets={planningDetails} isSectionOpen={isSectionOpen} />
      )}
      {!(_.isEmpty(decisionDetails) && _.isEmpty(initiativeDetails)) && !wizardActive && (
        <InitiativesAndDialogs dialogs={decisionDetails} initiatives={initiativeDetails} isSectionOpen={isSectionOpen}/>
      )}
    </Screen>
  );
}

Home.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default Home;
