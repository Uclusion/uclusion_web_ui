import React, { useEffect, useReducer, useState } from 'react'
import beginListening from './groupMembersMessages'
import reducer, { initializeState } from './groupMembersContextReducer'
import LocalForageHelper from '../../utils/LocalForageHelper'
import { BroadcastChannel } from 'broadcast-channel'
import { broadcastId } from '../../components/ContextHacks/BroadcastIdProvider'
import { isSignedOut } from '../../utils/userFunctions'
import { clearUclusionLocalStorage } from '../../components/localStorageUtils'

const MEMBERS_CHANNEL = 'members';
const GROUP_MEMBERS_CONTEXT_NAMESPACE = 'group_members';
const EMPTY_STATE = {initializing: true};
const GroupMembersContext = React.createContext(EMPTY_STATE);

function GroupMembersProvider(props) {
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);
  const [, setChannel] = useState(undefined);

  useEffect(() => {
    if (!isSignedOut()) {
      const myChannel = new BroadcastChannel(MEMBERS_CHANNEL);
      myChannel.onmessage = (msg) => {
        if (msg !== broadcastId) {
          console.info(`Reloading on group members channel message ${msg} with ${broadcastId}`);
          const lfg = new LocalForageHelper(GROUP_MEMBERS_CONTEXT_NAMESPACE);
          lfg.getState()
            .then((diskState) => {
              if (diskState) {
                dispatch(initializeState(diskState));
              }
            });
        }
      }
      setChannel(myChannel);
    }
    return () => {};
  }, []);

  useEffect(() => {
    if (!isSignedOut()) {
      const lfh = new LocalForageHelper(GROUP_MEMBERS_CONTEXT_NAMESPACE);
      lfh.getState()
        .then((diskState) => {
          if (diskState) {
            dispatch(initializeState(diskState));
          } else {
            dispatch(initializeState({}));
          }
        });
      beginListening(dispatch);
    } else {
      console.info('Clearing storage from group members context');
      clearUclusionLocalStorage(false);
    }
    return () => {};
  }, []);

  return (
    <GroupMembersContext.Provider value={[state, dispatch]}>
      {props.children}
    </GroupMembersContext.Provider>
  );
}

export { GroupMembersProvider, GroupMembersContext, EMPTY_STATE, GROUP_MEMBERS_CONTEXT_NAMESPACE,
  MEMBERS_CHANNEL };
