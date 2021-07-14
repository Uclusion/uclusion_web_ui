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
import { getAndClearRedirect, redirectToPath } from '../../utils/redirectUtils'
import WizardSelector from '../../components/AddNew/WizardSelector'
import UclusionTour from '../../components/Tours/UclusionTour';
import { SIGNUP_HOME } from '../../contexts/TourContext/tourContextHelper';
import { signupHomeSteps } from '../../components/Tours/signupHome';
import { CognitoUserContext } from '../../contexts/CognitoUserContext/CongitoUserContext';
import InitiativesAndDialogs from './InitiativesAndDialogs'
import { canCreate } from '../../contexts/AccountContext/accountContextHelper';
import UpgradeBanner from '../../components/Banners/UpgradeBanner';
import { AccountContext } from '../../contexts/AccountContext/AccountContext';
import { getExistingMarkets, hasInitializedGlobalVersion } from '../../contexts/VersionsContext/versionsContextHelper'
import { VersionsContext } from '../../contexts/VersionsContext/VersionsContext'
import OnboardingBanner from '../../components/Banners/OnboardingBanner'
import AddIcon from '@material-ui/icons/Add'
import AgilePlanIcon from '@material-ui/icons/PlaylistAdd'
import PlaylistAddCheckIcon from '@material-ui/icons/PlaylistAddCheck'
import GavelIcon from '@material-ui/icons/Gavel'
import PollIcon from '@material-ui/icons/Poll'
import { SearchResultsContext } from '../../contexts/SearchResultsContext/SearchResultsContext'
import { INVITED_USER_WORKSPACE } from '../../contexts/TourContext/tourContextHelper'
import { TourContext } from '../../contexts/TourContext/TourContext'
import { startTour } from '../../contexts/TourContext/tourContextReducer'

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
  const classes = useStyles();
  const [wizardActive, setWizardActive] = useState(false);
  const user = useContext(CognitoUserContext) || {};
  const [, tourDispatch] = useContext(TourContext);
  const [versionsContext] = useContext(VersionsContext);
  const createEnabled = canCreate(accountState);
  const initializedGlobalVersion = hasInitializedGlobalVersion(versionsContext);
  const banner = !initializedGlobalVersion ? undefined : _.isEmpty(getExistingMarkets(versionsContext)) ?
      <OnboardingBanner messageId='OnboardingCreatingCustomWorkspace' /> :
    createEnabled ? undefined : <UpgradeBanner/>;

  useEffect(() => {
    const redirect = getAndClearRedirect();
    if (!_.isEmpty(redirect) && redirect !== '/') {
      // Since we are going somewhere go ahead and start the invite tour - if they have taken already its
      // harmless and if they own the workspace they will get the demo tour which they have taken already
      tourDispatch(startTour(INVITED_USER_WORKSPACE));
      console.log(`Redirecting you to ${redirect}`);
      redirectToPath(history, redirect);
    }
  })

  const myNotHiddenMarketsState = getNotHiddenMarketDetailsForUser(marketsState, marketPresencesState, searchResults);
  const planningDetails = getMarketDetailsForType(myNotHiddenMarketsState, marketPresencesState, PLANNING_TYPE);
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
  const { results } = searchResults;
  const archiveMarkets = getHiddenMarketDetailsForUser(marketsState, marketPresencesState, searchResults);
  const navigationMenu = {navHeaderText: intl.formatMessage({ id: 'home' }), showSearchResults: true,
    navListItemTextArray: [{icon: AddIcon, text: intl.formatMessage({ id: 'addNew' }),
      onClickFunc: createEnabled && !wizardActive ? () => {
      setWizardActive(true);
      window.scrollTo(0, 0);
    } : undefined},
      createNavListItem(AgilePlanIcon, 'swimLanes', 'swimLanes'),
      createNavListItem(PlaylistAddCheckIcon, 'planningMarkets', 'planningMarkets', _.size(planningDetails)),
      createNavListItem(GavelIcon, 'dialogs', 'dia0', _.size(decisionDetails)),
      createNavListItem(PollIcon, 'initiatives', 'ini0', _.size(initiativeDetails)),
      {icon: MenuBookIcon, text: intl.formatMessage({ id: 'homeViewArchives' }),
        target: '/archives', num: _.isEmpty(results) ? undefined : _.size(archiveMarkets)}
    ]};

  return (
    <Screen
      title={intl.formatMessage({ 'id': 'homeBreadCrumb' })}
      tabTitle={intl.formatMessage({ id: 'homeBreadCrumb' })}
      hidden={hidden}
      isHome
      banner={banner}
      loading={!initializedGlobalVersion}
      navigationOptions={banner ? [] : navigationMenu}
    >
      <UclusionTour
        name={SIGNUP_HOME}
        steps={signupHomeSteps(user)}
      />
      <WizardSelector
        hidden={!wizardActive}
        onFinish={onWizardFinish}
        onCancel={() => setWizardActive(false)} />
      <React.Fragment>
        <div className={classes.titleContainer}>
          { <AgilePlanIcon htmlColor="#333333" /> }
          <Typography className={classes.title} variant="h6">Assigned Stories</Typography>
        </div>
        <PlanningDialogs markets={planningDetails}/>
        <hr className={classes.spacer}/>
        <InitiativesAndDialogs dialogs={decisionDetails} initiatives={initiativeDetails}/>
      </React.Fragment>
    </Screen>
  );
}

Home.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default Home;
