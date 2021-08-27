import React, { useContext, useEffect, useState } from 'react'
import { useHistory } from 'react-router';
import PropTypes from 'prop-types'
import _ from 'lodash'
import MenuBookIcon from '@material-ui/icons/MenuBook'
import { makeStyles, Typography } from '@material-ui/core'
import { useIntl } from 'react-intl'
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
import { CognitoUserContext } from '../../contexts/CognitoUserContext/CongitoUserContext';
import InitiativesAndDialogs from './InitiativesAndDialogs'
import { canCreate } from '../../contexts/AccountContext/accountContextHelper';
import UpgradeBanner from '../../components/Banners/UpgradeBanner';
import { AccountContext } from '../../contexts/AccountContext/AccountContext';
import {
  getExistingMarkets,
  getGlobalVersion,
  hasInitializedGlobalVersion
} from '../../contexts/VersionsContext/versionsContextHelper'
import { VersionsContext } from '../../contexts/VersionsContext/VersionsContext'
import AddIcon from '@material-ui/icons/Add'
import AgilePlanIcon from '@material-ui/icons/PlaylistAdd'
import PlaylistAddCheckIcon from '@material-ui/icons/PlaylistAddCheck'
import GavelIcon from '@material-ui/icons/Gavel'
import PollIcon from '@material-ui/icons/Poll'
import { SearchResultsContext } from '../../contexts/SearchResultsContext/SearchResultsContext'
import { INVITED_USER_WORKSPACE } from '../../contexts/TourContext/tourContextHelper'
import { TourContext } from '../../contexts/TourContext/TourContext'
import { startTour } from '../../contexts/TourContext/tourContextReducer'
import InvestiblesByWorkspace from '../Dialog/Planning/InvestiblesByWorkspace'
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import { getMarketInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper'
import { getStages } from '../../contexts/MarketStagesContext/marketStagesContextHelper'
import { getUserInvestibles } from '../Dialog/Planning/userUtils'
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import CreateWorkspaceDialog from '../../components/Warnings/CreateWorkspaceDialog'
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'
import { EMPTY_GLOBAL_VERSION } from '../../contexts/VersionsContext/versionsContextReducer'

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
  const [searchResults] = useContext(SearchResultsContext);
  const [marketsState] = useContext(MarketsContext);
  const [accountState] = useContext(AccountContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [operationRunning] = useContext(OperationInProgressContext);
  const classes = useStyles();
  const [wizardActive, setWizardActive] = useState(false);
  const user = useContext(CognitoUserContext) || {};
  const [, tourDispatch] = useContext(TourContext);
  const [versionsContext] = useContext(VersionsContext);
  const createEnabled = canCreate(accountState);
  //While fore ground loads there is no global version and operation is running
  const loadingForeGroundMarkets = !hasInitializedGlobalVersion(versionsContext) && operationRunning;
  const banner = loadingForeGroundMarkets || createEnabled ? undefined : <UpgradeBanner/>;
  const [chosenPerson, setChosenPerson] = React.useState({ name: '', email: '', external_id: '' });

  useEffect(() => {
    const redirect = getAndClearRedirect();
    if (!_.isEmpty(redirect) && redirect !== '/') {
      // Go ahead and start the invite tour - if they have taken already it's harmless
      tourDispatch(startTour(INVITED_USER_WORKSPACE));
      console.log(`Redirecting you to ${redirect}`);
      history.push(redirect);
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
    const marketPresences = getMarketPresences(marketPresencesState, market.id);
    const myPresence = marketPresences && marketPresences.find((presence) => {
      return presence.external_id === chosenPerson.external_id;
    });
    const presence = myPresence || {};
    const investibles = getMarketInvestibles(investiblesState, market.id, searchResults);
    const visibleStages = getStages(marketStagesState, market.id).filter((stage) => stage.appears_in_context)
      || [];
    const visibleStageIds = visibleStages.map((stage) => stage.id);
    const myInvestibles = getUserInvestibles(
      presence.id,
      market.id,
      investibles,
      visibleStageIds,
      searchResults
    ) || [];
    return { market, myInvestibles, presence };
  });
  const assignedSize = workspacesData.reduce((accumulator, currentValue) =>
    accumulator + currentValue.myInvestibles.length, 0);
  const archiveMarkets = getHiddenMarketDetailsForUser(marketsState, marketPresencesState, searchResults);
  const navigationMenu = {navHeaderText: intl.formatMessage({ id: 'home' }), showSearchResults: true,
    navListItemTextArray: [{icon: AddIcon, text: intl.formatMessage({ id: 'addNew' }),
      onClickFunc: createEnabled && !wizardActive ? () => {
      setWizardActive(true);
      window.scrollTo(0, 0);
    } : undefined},
      createNavListItem(AgilePlanIcon, 'mySwimLanes', 'swimLanes', assignedSize),
      createNavListItem(PlaylistAddCheckIcon, 'planningMarkets', 'planningMarkets', _.size(planningDetails)),
      createNavListItem(GavelIcon, 'dialogs', 'dia0', _.size(decisionDetails)),
      createNavListItem(PollIcon, 'initiatives', 'ini0', _.size(initiativeDetails)),
      {
        icon: MenuBookIcon, text: intl.formatMessage({ id: 'homeViewArchives' }),
        target: _.size(archiveMarkets) > 0 ? '/archives' : undefined,
        num: _.isEmpty(search) || _.size(archiveMarkets) === 0 ? undefined : _.size(archiveMarkets), newPage: true
      }
    ]};

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
      {!_.isEmpty(user) && _.isEmpty(getExistingMarkets(versionsContext))
      && getGlobalVersion(versionsContext) !== EMPTY_GLOBAL_VERSION && (
        <CreateWorkspaceDialog user={user} hidden={wizardActive} />
      )}
      <WizardSelector
        hidden={!wizardActive}
        onFinish={onWizardFinish}
        onCancel={() => setWizardActive(false)} />
        {!_.isEmpty(getExistingMarkets(versionsContext)) && (
          <React.Fragment>
            <div className={classes.titleContainer}>
              { <AgilePlanIcon htmlColor="#333333" /> }
              <Typography className={classes.title} variant="h6">
                {intl.formatMessage({ id: 'homeAssignments' })}
              </Typography>
            </div>
            <div id="swimLanes">
            <InvestiblesByWorkspace workspaces={planningDetails} chosenPerson={chosenPerson}
                                    showAddNew={createEnabled && !wizardActive} setChosenPerson={setChosenPerson}
                                    workspacesData={workspacesData} setWizardActive={setWizardActive}/>
            </div>
            <hr className={classes.spacer}/>
            <PlanningDialogs markets={planningDetails}/>
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
