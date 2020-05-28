import React, { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router'
import PropTypes from 'prop-types'
import _ from 'lodash'
import MenuBookIcon from '@material-ui/icons/MenuBook'
import { makeStyles, Typography } from '@material-ui/core'
import { useIntl } from 'react-intl'
import Screen from '../../containers/Screen/Screen'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import {
  getMarketDetailsForType,
  getNotHiddenMarketDetailsForUser,
} from '../../contexts/MarketsContext/marketsContextHelper'
import PlanningDialogs from './PlanningDialogs'
import DecisionDialogs from './DecisionDialogs'
import { DECISION_TYPE, INITIATIVE_TYPE, PLANNING_TYPE, } from '../../constants/markets'
import InitiativeDialogs from './InitiativeDialogs'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { navigate } from '../../utils/marketIdPathFunctions'
import { getDialogTypeIcon } from '../../components/Dialogs/dialogIconFunctions'
import DismissableText from '../../components/Notifications/DismissableText'
import { getAndClearRedirect, redirectToPath } from '../../utils/redirectUtils'
import AddNewWizard from './Wizards/AddNewWizard';

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
  const [marketsState] = useContext(MarketsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const classes = useStyles();
  const [wizardActive, setWizardActive] = useState(false);

  useEffect(() => {
    const redirect = getAndClearRedirect();
    if (!_.isEmpty(redirect)) {
      console.log(`Redirecting you to ${redirect}`);
      redirectToPath(history, redirect);
    }
  })

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

  const noMarkets = _.isEmpty(planningDetails) && _.isEmpty(decisionDetails) && _.isEmpty(initiativeDetails);
  
  const ACTIONBAR_ACTIONS = [
    {
      label: intl.formatMessage({ id: 'homeViewArchivesExplanation' }),
      openLabel: intl.formatMessage({ id: 'homeViewArchives' }),
      icon: <MenuBookIcon/>,
      id: 'archive',
      onClick: () => navigate(history, '/archives'),
    },
    {
      label: intl.formatMessage({ id: 'homeAddNewExplanation' }),
      openLabel: intl.formatMessage({ id: 'homeAddNew' }),
      id: 'addNew',
      onClick: () => setWizardActive(true),
    }
  ];
  
  return (
    <Screen
      title={intl.formatMessage({ 'id': 'homeBreadCrumb' })}
      tabTitle={intl.formatMessage({ id: 'homeBreadCrumb' })}
      hidden={hidden}
      isHome
      sidebarActions={ACTIONBAR_ACTIONS}
    >
      <AddNewWizard hidden={!wizardActive} onCancel={() => setWizardActive(false)}/>

      {noMarkets && (
          <DismissableText textId="homeNoMarkets"/>
      )}
      {!noMarkets && (
        <React.Fragment>
          <div className={classes.titleContainer}>
            { getDialogTypeIcon(PLANNING_TYPE, false, "#333333") }
            <Typography className={classes.title} variant="h6">Workspaces</Typography>
          </div>
          <PlanningDialogs markets={planningDetails}/>
          <hr className={classes.spacer}/>
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
