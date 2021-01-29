import React, { useContext, useEffect, useState } from 'react'
import { useHistory } from 'react-router';
import PropTypes from 'prop-types'
import _ from 'lodash'
import MenuBookIcon from '@material-ui/icons/MenuBook'
import { makeStyles, Typography } from '@material-ui/core'
import { useIntl } from 'react-intl'
import Screen from '../../containers/Screen/Screen'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { getMarketDetailsForType, getNotHiddenMarketDetailsForUser } from '../../contexts/MarketsContext/marketsContextHelper';
import PlanningDialogs from './PlanningDialogs'
import { DECISION_TYPE, INITIATIVE_TYPE, PLANNING_TYPE, } from '../../constants/markets'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { formMarketManageLink, navigate } from '../../utils/marketIdPathFunctions'
import { getDialogTypeIcon } from '../../components/Dialogs/dialogIconFunctions'
import { getAndClearRedirect, redirectToPath } from '../../utils/redirectUtils'
import WizardSelector from '../../components/AddNew/WizardSelector'
import UclusionTour from '../../components/Tours/UclusionTour';
import { SIGNUP_HOME } from '../../contexts/TourContext/tourContextHelper';
import { signupHomeSteps } from '../../components/Tours/InviteTours/signupHome';
import { CognitoUserContext } from '../../contexts/CognitoUserContext/CongitoUserContext';
import { startTour } from '../../contexts/TourContext/tourContextReducer';
import { TourContext } from '../../contexts/TourContext/TourContext';
import InitiativesAndDialogs from './InitiativesAndDialogs'
import AddNewOrUpgradeButton from './AddNewOrUpgradeButton';
import { canCreate } from '../../contexts/AccountContext/accountContextHelper';
import UpgradeBanner from '../../components/Banners/UpgradeBanner';
import { AccountContext } from '../../contexts/AccountContext/AccountContext';
import { getExistingMarkets, hasInitializedGlobalVersion } from '../../contexts/VersionsContext/versionsContextHelper'
import { createECPMarkets } from '../Invites/ECPMarketGenerator'
import { toastError } from '../../utils/userMessage'
import { VersionsContext } from '../../contexts/VersionsContext/VersionsContext'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { DiffContext } from '../../contexts/DiffContext/DiffContext'
import OnboardingBanner from '../../components/Banners/OnboardingBanner'
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext'

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
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [marketsState, marketsDispatch] = useContext(MarketsContext);
  const [accountState] = useContext(AccountContext);
  const [marketPresencesState, presenceDispatch] = useContext(MarketPresencesContext);
  const classes = useStyles();
  const [wizardActive, setWizardActive] = useState(false);
  const user = useContext(CognitoUserContext) || {};
  const [, tourDispatch] = useContext(TourContext);
  const [versionsContext] = useContext(VersionsContext);
  const [clearedToCreate, setClearedToCreate] = useState(undefined);
  const [, commentsDispatch] = useContext(CommentsContext);
  const createEnabled = canCreate(accountState);
  const banner = !hasInitializedGlobalVersion(versionsContext) ?
    undefined : clearedToCreate ? <OnboardingBanner messageId='OnboardingCreatingCustomWorkspace' /> :
    createEnabled ? undefined : <UpgradeBanner/>;

  useEffect(() => {
    const redirect = getAndClearRedirect();
    if (!_.isEmpty(redirect) && redirect !== '/') {
      console.log(`Redirecting you to ${redirect}`);
      redirectToPath(history, redirect);
    }
  })

  useEffect(() => {
    // If cleared to create has been set already then do not re-enter
    // The gap where versions context can change before cleared to create is set is fine because
    // the onboarding user still won't have any markets until cleared to create is set and creation begins
    if (hasInitializedGlobalVersion(versionsContext) && clearedToCreate === undefined) {
      const myClear = _.isEmpty(getExistingMarkets(versionsContext));
      // Do not create onboarding markets if they already have markets
      setClearedToCreate(myClear);
    }
  }, [clearedToCreate, versionsContext]);

  useEffect(() => {
    if (!hidden && clearedToCreate !== undefined) {
      if (clearedToCreate) {
        // Only hidden, history and clearedToCreate dependencies can change so safe from re-entry
        const dispatchers = { marketsDispatch, diffDispatch, presenceDispatch, investiblesDispatch, commentsDispatch };
        // if we want to do something utm based it was passed as prop to Home
        createECPMarkets(dispatchers)
          .then(() => {
            console.log('Done creating');
            setClearedToCreate(false);
            tourDispatch(startTour(SIGNUP_HOME));
          })
          .catch((error) => {
            console.error(error);
            toastError('errorMarketFetchFailed');
          });
      }
    }
  }, [hidden, history, marketsDispatch, diffDispatch, presenceDispatch, investiblesDispatch, clearedToCreate,
    tourDispatch, commentsDispatch]);

  const myNotHiddenMarketsState = getNotHiddenMarketDetailsForUser(
    marketsState,
    marketPresencesState,
  );

  const planningDetails = getMarketDetailsForType(myNotHiddenMarketsState, marketPresencesState, PLANNING_TYPE);
  const decisionDetails = _.sortBy(getMarketDetailsForType(
    myNotHiddenMarketsState,
    marketPresencesState,
    DECISION_TYPE,
  ), 'created_at').reverse();
  const initiativeDetails = _.sortBy(getMarketDetailsForType(
    myNotHiddenMarketsState,
    marketPresencesState,
    INITIATIVE_TYPE,
  ), 'created_at').reverse();
  
  const ACTIONBAR_ACTIONS = [
    {
      label: intl.formatMessage({ id: 'homeViewArchivesExplanation' }),
      openLabel: intl.formatMessage({ id: 'homeViewArchives' }),
      icon: <MenuBookIcon/>,
      id: 'archive',
      onClick: () => navigate(history, '/archives'),
    },
  ];

  if (wizardActive) {
    ACTIONBAR_ACTIONS.push({
      label: intl.formatMessage({ id: 'homeAddNewExplanation' }),
      openLabel: intl.formatMessage({ id: 'cancel' }),
      id: 'addNew',
      onClick: () => setWizardActive(false),
    });
  } else {
    ACTIONBAR_ACTIONS.push({
      prototype: <AddNewOrUpgradeButton/>,
      id: 'addNew',
      onClick: () => setWizardActive(true),
    });
  }

  function onWizardFinish (formData) {
    const { marketId } = formData;
    setWizardActive(false);
    const link = formMarketManageLink(marketId, true);
    navigate(history, link);
  }

  return (
    <Screen
      title={intl.formatMessage({ 'id': 'homeBreadCrumb' })}
      tabTitle={intl.formatMessage({ id: 'homeBreadCrumb' })}
      hidden={hidden}
      isHome
      sidebarActions={ACTIONBAR_ACTIONS}
      banner={banner}
      loading={!hasInitializedGlobalVersion(versionsContext)}
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
          { getDialogTypeIcon(PLANNING_TYPE, false, "#333333") }
          <Typography className={classes.title} variant="h6">Workspaces</Typography>
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
