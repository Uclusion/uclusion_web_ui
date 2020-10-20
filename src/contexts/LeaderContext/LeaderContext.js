import React, { useEffect, useReducer, useState } from 'react'
import { BroadcastChannel, createLeaderElection } from 'broadcast-channel'

const EMPTY_STATE = {
  leader: undefined,
};
const LEADER_CHANNEL = 'leader';
const LeaderContext = React.createContext(EMPTY_STATE);

function LeaderProvider(props) {
  const [state, dispatch] = useReducer((state, action) => {
    const { isLeader } = action;
    return { isLeader };
  }, EMPTY_STATE);
  const [, setElector] = useState(undefined);

  useEffect(() => {
    const myChannel = new BroadcastChannel(LEADER_CHANNEL);
    const elector = createLeaderElection(myChannel);
    elector.applyOnce().then((isLeader) => {
      console.info(`Setting leader to ${isLeader}`);
      dispatch({ isLeader });
      if (!isLeader) {
        return elector.awaitLeadership().then(() => dispatch({isLeader: true}));
      }
      return isLeader;
    });
    setElector(elector);
    return () => {};
  }, []);

  return (
    <LeaderContext.Provider value={[state]}>
      {props.children}
    </LeaderContext.Provider>
  );
}

export { LeaderProvider, LeaderContext, LEADER_CHANNEL };
