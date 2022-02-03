import React, { useEffect, useReducer, useState } from 'react'
import { BroadcastChannel, createLeaderElection } from 'broadcast-channel'
import { pushMessage } from '../../utils/MessageBusUtils'
import { OPERATION_HUB_CHANNEL, STOP_OPERATION } from '../OperationInProgressContext/operationInProgressMessages'
import reducer, { updateLeader } from './leaderContextReducer'

const EMPTY_STATE = {
  leader: undefined,
};

const LeaderContext = React.createContext(EMPTY_STATE);

function LeaderProvider(props) {
  const { children, authState, userId } = props;
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);
  const [channel, setChannel] = useState(undefined);


  useEffect(() => {
    let myChannel;
    if (authState === 'signedIn' && userId) {
      console.info(`Processing leader with userId ${userId}`);
      myChannel = new BroadcastChannel(userId);
      setChannel(myChannel);
    }
    return () => {
      if (myChannel) {
        console.info('Closing channel');
        myChannel.close();
        setChannel(undefined);
      }
    };
  }, [authState, userId]);

  useEffect(() => {
    if (channel) {
      console.info('Applying for leader');
      // If you grab leader not signed in then you risk stalling out as no one gets data
      const elector = createLeaderElection(channel, {
        fallbackInterval: 5000, // optional configuration for how often will renegotiation for leader occur
        responseTime: 5000, // optional configuration for how long will instances have to respond
      });
      return elector.applyOnce().then((isLeader) => {
        // Could use broadcast ID to send message out to others to refresh out of login page
        // but its a bit risky as can somehow infinite refresh and corner of corner case anyway
        dispatch(updateLeader(isLeader));
        if (!isLeader) {
          // First turn off in progress for the versions sync since leader does that
          pushMessage(OPERATION_HUB_CHANNEL, { event: STOP_OPERATION });
          return elector.awaitLeadership().then(() => dispatch(updateLeader(true)));
        }
        return isLeader;
      });
    }
    return () => {};
  }, [channel]);

  return (
    <LeaderContext.Provider value={[state, dispatch]}>
      {children}
    </LeaderContext.Provider>
  );
}

export { LeaderProvider, LeaderContext };
