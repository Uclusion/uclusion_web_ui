import React, { useEffect, useReducer } from 'react'
import beginListening from './groupMembersMessages'
import reducer, { initializeState } from './groupMembersContextReducer'
import LocalForageHelper from '../../utils/LocalForageHelper'

const MEMBERS_CHANNEL = 'members';
const GROUP_MEMBERS_CONTEXT_NAMESPACE = 'group_members';
const EMPTY_STATE = {initializing: true};
const GroupMembersContext = React.createContext(EMPTY_STATE);

let groupMembersContextHack;
export { groupMembersContextHack };

function GroupMembersProvider(props) {
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);

  useEffect(() => {
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
    return () => {};
  }, []);
  groupMembersContextHack = state;
  return (
    <GroupMembersContext.Provider value={[state, dispatch]}>
      {props.children}
    </GroupMembersContext.Provider>
  );
}

export { GroupMembersProvider, GroupMembersContext, EMPTY_STATE, GROUP_MEMBERS_CONTEXT_NAMESPACE,
  MEMBERS_CHANNEL };
