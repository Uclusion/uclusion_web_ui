import LocalForageHelper from '../../utils/LocalForageHelper'
import {
  GROUP_MEMBERS_CONTEXT_NAMESPACE,
  MEMBERS_CHANNEL
} from './GroupMembersContext'
import _ from 'lodash'
import { BroadcastChannel } from 'broadcast-channel'
import { broadcastId } from '../../components/ContextHacks/BroadcastIdProvider'
import { removeInitializing } from '../../components/localStorageUtils'
import { addByIdAndVersion } from '../ContextUtils'

const INITIALIZE_STATE = 'INITIALIZE_STATE';
const ADD_GROUP_MEMBER = 'ADD_GROUP_MEMBER';
const ADD_GROUP_MEMBERS = 'ADD_GROUP_MEMBERS';
const UPDATE_FROM_VERSIONS = 'UPDATE_FROM_VERSIONS';
const MODIFY_GROUP_MEMBERS = 'MODIFY_GROUP_MEMBERS';

/** Messages you can send the reducer **/

export function initializeState(newState) {
  return {
    type: INITIALIZE_STATE,
    newState,
  };
}

export function addGroupMember(groupId, user) {
  return {
    type: ADD_GROUP_MEMBER,
    groupId,
    user,
  };
}

export function addGroupMembers(groupId, users) {
  return {
    type: ADD_GROUP_MEMBERS,
    groupId,
    users
  };
}

export function modifyGroupMembers(groupId, users) {
  return {
    type: MODIFY_GROUP_MEMBERS,
    groupId,
    users,
  };
}

export function versionsUpdateGroupMembers(memberDetails) {
  return {
    type: UPDATE_FROM_VERSIONS,
    memberDetails
  };
}

/** Functions that update the state **/

function doAddGroupMember(state, action) {
  const { groupId, user } = action;
  const oldUsers = state[groupId] || [];
  const member = { id: user.id, deleted: false, group_id: groupId, version: 1 };
  const newUsers = _.unionBy([{ ...member, fromQuickAdd: true }], oldUsers, 'id');
  return {
    ...state,
    [groupId]: newUsers,
  };
}

function doAddGroupMembers(state, action) {
  const { groupId, users } = action;
  const oldUsers = state[groupId] || [];
  const transformedUsers = users.map((user) => {
    return { ...user, fromQuickAdd: true };
  });
  const newUsers = _.unionBy(transformedUsers, oldUsers, 'id');
  return {
    ...state,
    [groupId]: newUsers,
  };
}

function doUpdateGroupMembers(state, action) {
  const { memberDetails } = action;
  const userDetails = {};
  (memberDetails || []).forEach((user) => {
    const {group_id: groupId} = user;
    if (!userDetails[groupId]) {
      userDetails[groupId] = [];
    }
    userDetails[groupId].push(user);
  })
  const newState = {...state};
  Object.keys(userDetails).forEach((groupId) => {
    newState[groupId] = addByIdAndVersion(userDetails[groupId], newState[groupId]);
  });
  return removeInitializing(newState);
}

function doModifyGroupMembers(state, action) {
  const { groupId, users } = action;
  const oldUsersRaw = state[groupId] || [];
  const newState = {...state};
  newState[groupId] = _.unionBy(users, oldUsersRaw, 'id');
  return newState;
}

function computeNewState(state, action) {
  switch(action.type) {
    case INITIALIZE_STATE:
      return action.newState;
    case ADD_GROUP_MEMBER:
      return doAddGroupMember(state, action);
    case ADD_GROUP_MEMBERS:
      return doAddGroupMembers(state, action);
    case MODIFY_GROUP_MEMBERS:
      return doModifyGroupMembers(state, action);
    case UPDATE_FROM_VERSIONS:
      return doUpdateGroupMembers(state, action);
    default:
      return state;
  }
}

let presencesStoragePromiseChain = Promise.resolve(true);

function reducer(state, action) {
  const newState = computeNewState(state, action);
  if (action.type !== INITIALIZE_STATE) {
    const lfh = new LocalForageHelper(GROUP_MEMBERS_CONTEXT_NAMESPACE);
    presencesStoragePromiseChain = presencesStoragePromiseChain.then(() => {
        lfh.setState(newState).then(() => {
          const myChannel = new BroadcastChannel(MEMBERS_CHANNEL);
          return myChannel.postMessage(broadcastId || 'presence').then(() => myChannel.close())
            .then(() => console.info('Update presence context sent.'));
        });
    });
  }
  return newState;
}

export default reducer;
