import React, { useContext, useEffect, useReducer } from 'react';
import { waitForLeadership } from 'tab-election';
import reducer, { updateLeader } from './leaderContextReducer'
import { refreshVersions } from '../../api/versionedFetchUtils'
import { AccountContext } from '../AccountContext/AccountContext';
import { userIsLoaded } from '../AccountContext/accountUserContextHelper';

const EMPTY_STATE = {
  leader: undefined,
};

const LeaderContext = React.createContext(EMPTY_STATE);

function LeaderProvider(props) {
  const { children, authState, userId } = props;
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);
  const [userState] = useContext(AccountContext);
  const isUserLoaded = userIsLoaded(userState);
  const { isLeader } = state;

  useEffect(() => {
    if (authState === 'signedIn' && userId) {
      waitForLeadership(() => {
        console.info(`Claiming leadership`);
        // Could use broadcast ID to send message out to others to refresh out of login page
        // but its a bit risky as can somehow infinite refresh and corner of corner case anyway
        dispatch(updateLeader(true));
      });
    }
    return () => {};
  }, [authState, userId]);

  useEffect(() => {
    if (isUserLoaded && isLeader) {
      waitForLeadership(() => {
        console.info('Leadership refreshing versions');
        return refreshVersions().then(() => {
          console.info('Refreshed versions from leader init');
        }).catch(() => console.warn('Error refreshing'));
      });
    }
    return () => {};
  }, [isUserLoaded, isLeader]);

  return (
    <LeaderContext.Provider value={[state, dispatch]}>
      {children}
    </LeaderContext.Provider>
  );
}

export { LeaderProvider, LeaderContext };
