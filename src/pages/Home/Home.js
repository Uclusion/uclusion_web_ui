import React, { useContext, useEffect } from 'react'
import { useHistory } from 'react-router';
import _ from 'lodash'
import Screen from '../../containers/Screen/Screen'
import { getLastWorkspaceLink, getRedirect } from '../../utils/redirectUtils'
import { INVITED_USER_WORKSPACE } from '../../contexts/TourContext/tourContextHelper'
import { TourContext } from '../../contexts/TourContext/TourContext'
import { startTour } from '../../contexts/TourContext/tourContextReducer'
import {
  getMarketDetailsForType,
  getNotHiddenMarketDetailsForUser
} from '../../contexts/MarketsContext/marketsContextHelper'
import { PLANNING_TYPE } from '../../constants/markets'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { formMarketLink, navigate } from '../../utils/marketIdPathFunctions'
import { getChangedIds } from '../../api/summaries'

function Home() {
  const history = useHistory();
  const [, tourDispatch] = useContext(TourContext);
  const [marketsState] = useContext(MarketsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const myNotHiddenMarketsState = getNotHiddenMarketDetailsForUser(marketsState, marketPresencesState);
  const planningDetails = getMarketDetailsForType(myNotHiddenMarketsState, marketPresencesState, PLANNING_TYPE);

  useEffect(() => {
    const redirect = getRedirect();
    if (!_.isEmpty(redirect) && redirect !== '/') {
      // Go ahead and start the invite tour - if they have taken already it's harmless
      tourDispatch(startTour(INVITED_USER_WORKSPACE));
      console.log(`Redirecting you to ${redirect}`);
      history.push(redirect);
    }
  });

  useEffect(() => {
    const redirect = getRedirect();
    if (_.isEmpty(redirect) || redirect === '/') {
      // Getting changed IDs with no current version should get full list
      getChangedIds(null).then((versions) => {
          const { foreground: foregroundList } = versions;
          if (_.isEmpty(foregroundList)) {
            console.log('Redirecting for onboarding');
            history.push('/inbox');
          } else {
            // There is no redirect stored and the user already has an active Workspace
            const lastWorkspaceLink = getLastWorkspaceLink();
            if (lastWorkspaceLink) {
              console.log('Redirecting to Inbox');
              navigate(history, '/inbox');
            } else {
              // Don't go to the Inbox because the chevron there won't work to get them off the Inbox
              const id = foregroundList[0];
              console.log(`Redirecting you to workspace ${id}`);
              // Use navigate to record new redirect
              navigate(history,  formMarketLink(id));
            }
          }
        });
    }
  }, [history, planningDetails]);

  return (
    <Screen
      hidden={false}
      loading={true}
    />
  );
}

export default Home;
