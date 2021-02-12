import React, { useEffect, useReducer, useState } from 'react'
import { BroadcastChannel, createLeaderElection } from 'broadcast-channel'

const EMPTY_STATE = {
  leader: undefined,
};
const LEADER_CHANNEL = 'leader';
const LeaderContext = React.createContext(EMPTY_STATE);

function LeaderProvider(props) {
  const { children, authState } = props;
  const [state, dispatch] = useReducer((state, action) => {
    const { isLeader } = action;
    return { isLeader };
  }, EMPTY_STATE);
  const [, setElector] = useState(undefined);

  useEffect(() => {
    console.info(`Processing leader with authState ${authState}`);
    if (authState === 'signedIn') {
      const myChannel = new BroadcastChannel(LEADER_CHANNEL);
      // If you grab leader not signed in then you risk stalling out as no one gets data
      const elector = createLeaderElection(myChannel);
      elector.applyOnce().then((isLeader) => {
        console.info(`Setting leader to ${isLeader}`);
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
