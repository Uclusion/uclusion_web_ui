import React, { useCallback, useEffect, useReducer } from 'react'
import beginListening from './groupMembersMessages'
import reducer, { initializeState } from './groupMembersContextReducer'
import LocalForageHelper from '../../utils/LocalForageHelper'
import { flushSync } from 'react-dom';

const MEMBERS_CHANNEL = 'members';
const GROUP_MEMBERS_CONTEXT_NAMESPACE = 'group_members';
const EMPTY_STATE = {initializing: true};
const GroupMembersContext = React.createContext(EMPTY_STATE);

let groupMembersContextHack;
export { groupMembersContextHack };

function GroupMembersProvider(props) {
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);

  const hydrateGroupMembersFromDisk = useCallback(() => {
    const lfh = new LocalForageHelper(GROUP_MEMBERS_CONTEXT_NAMESPACE);
    return lfh.getStoredState().then((diskState) => {
      const hydratedState = diskState || {};
      flushSync(() => dispatch(initializeState(hydratedState)));
      return hydratedState;
    });
  }, []);

  useEffect(() => {
    hydrateGroupMembersFromDisk()
      .catch((error) => console.warn('Unable to load members from disk', error));
    beginListening(dispatch);
    return () => {};
  }, [hydrateGroupMembersFromDisk]);
  groupMembersContextHack = state;
  return (
    <GroupMembersContext.Provider value={[state, dispatch, hydrateGroupMembersFromDisk]}>
      {props.children}
    </GroupMembersContext.Provider>
  );
}

export { GroupMembersProvider, GroupMembersContext, EMPTY_STATE, GROUP_MEMBERS_CONTEXT_NAMESPACE,
  MEMBERS_CHANNEL };
