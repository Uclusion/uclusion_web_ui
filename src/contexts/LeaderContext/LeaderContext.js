import React, { useEffect, useReducer } from 'react'
import { waitForLeadership } from 'tab-election';
import reducer, { updateLeader } from './leaderContextReducer'
import { refreshVersions } from '../../api/versionedFetchUtils'

const EMPTY_STATE = {
  leader: undefined,
};

const LeaderContext = React.createContext(EMPTY_STATE);

function LeaderProvider(props) {
  const { children, authState, userId } = props;
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);



  useEffect(() => {
    if (authState === 'signedIn' && userId) {
      waitForLeadership(() => {
        console.info(`Claiming leadership`);
        // Could use broadcast ID to send message out to others to refresh out of login page
        // but its a bit risky as can somehow infinite refresh and corner of corner case anyway
        dispatch(updateLeader(true));
        // Go ahead and get the latest when determine leader
        return refreshVersions(true).then(() => {
          console.info('Refreshed versions from leader init');
        });
      });
    }
    return () => {};
  }, [authState, userId]);

  return (
    <LeaderContext.Provider value={[state, dispatch]}>
      {children}
    </LeaderContext.Provider>
  );
}

export { LeaderProvider, LeaderContext };
