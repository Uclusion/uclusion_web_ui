import React, { useEffect, useReducer, useState } from 'react'
import { BroadcastChannel, createLeaderElection } from 'broadcast-channel'
import { pushMessage } from '../../utils/MessageBusUtils'
import { OPERATION_HUB_CHANNEL, STOP_OPERATION } from '../OperationInProgressContext/operationInProgressMessages'

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
          // First turn off in progress for the versions sync since leader does that
          pushMessage(OPERATION_HUB_CHANNEL, { event: STOP_OPERATION });
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
