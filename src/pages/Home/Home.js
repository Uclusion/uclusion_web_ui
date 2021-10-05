import React, { useContext, useEffect, useState } from 'react'
import { useHistory } from 'react-router';
import PropTypes from 'prop-types'
import _ from 'lodash'
import MenuBookIcon from '@material-ui/icons/MenuBook'
import { makeStyles, Typography, useMediaQuery, useTheme } from '@material-ui/core'
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
  formMarketManageLink,
  navigate
} from '../../utils/marketIdPathFunctions'
import { getAndClearRedirect } from '../../utils/redirectUtils'
import WizardSelector from '../../components/AddNew/WizardSelector'
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

const useStyles = makeStyles(() => ({
    spacer: {
      borderColor: '#ccc',
      borderStyle: 'solid',
      margin: '2rem 0'
    },
    titleContainer: {
      width: 'auto',
      display: 'flex',
      alignItems: 'center',
      marginBottom: '1rem'
    },
    title: {
      marginLeft: '1rem'
    }
  })
)
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
  const [operationRunning] = useContext(OperationInProgressContext)
  const classes = useStyles()
  const [wizardActive, setWizardActive] = useState(false)
  const [, tourDispatch] = useContext(TourContext)
  const [versionsContext] = useContext(VersionsContext)
  const createEnabled = canCreate(accountState)
  //While fore ground loads there is no global version and operation is running
  const loadingForeGroundMarkets = !hasLoadedGlobalVersion(versionsContext) || marketsState.initializing ||
    (!hasInitializedGlobalVersion(versionsContext) && operationRunning)
  const banner = loadingForeGroundMarkets || createEnabled ? undefined : <UpgradeBanner/>
  const [chosenPerson, setChosenPerson] = React.useState({ name: '', email: '', external_id: '' })

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
    const { marketId } = formData;
    setWizardActive(false);
    const link = formMarketManageLink(marketId, true);
    navigate(history, link);
  }

  function createNavListItem(icon, textId, anchorId, howManyNum, alwaysShow) {
    return baseNavListItem('/', icon, textId, anchorId, howManyNum, alwaysShow);
  }
  const { search } = searchResults;
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
  const noActiveNonSupportMarkets = _.isEmpty(planningDetails) && _.isEmpty(decisionDetails)
    && _.isEmpty(initiativeDetails.filter((initiative) => {
      const { market_sub_type: marketSubType } = initiative;
      return marketSubType !== 'REQUIREMENTS';
    }));
  const showAddNew = createEnabled && !wizardActive && !noActiveNonSupportMarkets;
  const navigationMenu = {
    navHeaderIcon: HomeIcon, navTooltip: 'homeNavTooltip', showSearchResults: true,
    navListItemTextArray: [{
      icon: AddIcon, text: intl.formatMessage({ id: 'addNew' }),
      onClickFunc: showAddNew ? () => {
        setWizardActive(true)
        window.scrollTo(0, 0)
      } : undefined
    },
      createNavListItem(AgilePlanIcon, _.isEmpty(search) ? 'mySwimLanes' : 'mySearchSwimLanes',
        'swimLanes', assignedSize),
      createNavListItem(PlaylistAddCheckIcon, 'planningMarkets', 'planningMarkets', _.size(planningDetails)),
      createNavListItem(GavelIcon, 'dialogs', 'dia0', _.size(decisionDetails)),
      createNavListItem(PollIcon, 'initiatives', 'ini0', _.size(initiativeDetails)),
      {
        icon: MenuBookIcon, text: intl.formatMessage({ id: 'homeViewArchives' }),
        target: _.size(archiveMarkets) > 0 ? '/archives' : undefined,
        num: _.isEmpty(search) || _.size(archiveMarkets) === 0 ? undefined : _.size(archiveMarkets), newPage: true
      }
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
      <WizardSelector
        hidden={!wizardActive && !noActiveNonSupportMarkets}
        onFinish={onWizardFinish}
        showCancel={!noActiveNonSupportMarkets}
        onCancel={() => setWizardActive(false)}/>
      {(_.size(archiveMarkets) > 0 || showAddNew) && (
        <div style={{ display: 'flex', marginBottom: '2rem' }}>
          {_.size(archiveMarkets) > 0 && midLayout && (
            <SpinningIconLabelButton icon={MenuBookIcon} onClick={() => navigate(history, '/archives')}
                                     doSpin={false}>
              <FormattedMessage id={'homeViewArchives'}/>
            </SpinningIconLabelButton>
          )}
          {showAddNew && midLayout && (
            <SpinningIconLabelButton icon={AddIcon} onClick={() => setWizardActive(true)} doSpin={false}>
              <FormattedMessage id={'addNew'}/>
            </SpinningIconLabelButton>
          )}
        </div>
      )}
      {assignedSize > 0 && (
        <div className={classes.titleContainer}>
          {<AgilePlanIcon htmlColor="#333333"/>}
          <Typography className={classes.title} variant="h6">
            {intl.formatMessage({ id: 'homeAssignments' })}
          </Typography>
        </div>
      )}
      <div id="swimLanes">
        <InvestiblesByWorkspace workspaces={planningDetails} chosenPerson={chosenPerson}
                                setChosenPerson={setChosenPerson} workspacesData={workspacesData} />
      </div>
      {!_.isEmpty(planningDetails) && (
        <React.Fragment>
          {(assignedSize > 0 || wizardActive) && (
            <hr className={classes.spacer}/>
          )}
          <PlanningDialogs markets={planningDetails}/>
        </React.Fragment>
      )}
      {!(_.isEmpty(decisionDetails) && _.isEmpty(initiativeDetails)) && (
        <React.Fragment>
          <hr className={classes.spacer}/>
          <InitiativesAndDialogs dialogs={decisionDetails} initiatives={initiativeDetails}/>
        </React.Fragment>
      )}
    </Screen>
  );
}

Home.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default Home;
