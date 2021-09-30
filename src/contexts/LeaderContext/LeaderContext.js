import React, { useEffect, useReducer, useState } from 'react'
import { BroadcastChannel, createLeaderElection } from 'broadcast-channel'
import LocalForageHelper from '../../utils/LocalForageHelper'
import { VERSIONS_CONTEXT_NAMESPACE } from '../VersionsContext/versionsContextReducer'

const EMPTY_STATE = {
  leader: undefined,
};
const LEADER_CHANNEL = 'leader';
const LeaderContext = React.createContext(EMPTY_STATE);

function LeaderProvider(props) {
  const { children, authState } = props;
  const [state, dispatch] = useReducer((state, action) => {
    const { isLeader } = action;
    console.info(`Setting leader to ${isLeader}`);
    return { isLeader };
  }, EMPTY_STATE);
  const [, setElector] = useState(undefined);

  useEffect(() => {
    console.info(`Processing leader with authState ${authState}`);
    if (authState === 'signedIn') {
      const lfg = new LocalForageHelper(VERSIONS_CONTEXT_NAMESPACE);
      lfg.getState().then((diskState) => {
          if (!diskState) {
            // If there is no disk then I must be the first tab opened and we can't wait for election results
            dispatch({isLeader: true});
          }
      });
      const myChannel = new BroadcastChannel(LEADER_CHANNEL);
      // If you grab leader not signed in then you risk stalling out as no one gets data
      const elector = createLeaderElection(myChannel, {
        fallbackInterval: 5000, // optional configuration for how often will renegotiation for leader occur
        responseTime: 5000, // optional configuration for how long will instances have to respond
      });
      elector.applyOnce().then((isLeader) => {
        // Could use broadcast ID to send message out to others to refresh out of login page
        // but its a bit risky as can somehow infinite refresh and corner of corner case anyway
        dispatch({ isLeader });
        if (!isLeader) {
          return elector.awaitLeadership().then(() => dispatch({isLeader: true}));
        }
        return isLeader;
      });
      setElector(elector);
    }
    return () => {};
  }, [authState]);

  return (
    <LeaderContext.Provider value={[state]}>
      {children}
    </LeaderContext.Provider>
  );
}

export { LeaderProvider, LeaderContext, LEADER_CHANNEL };
