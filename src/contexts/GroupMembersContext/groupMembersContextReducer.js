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

//TODO fix this to have associated message that fixes participants or return from backend and use versionsupdate one
//TODO - IF YOU display a UI to add people then removing yourself (already selected) would have to be an option
// and then just require that at least one person is chosen and remove back end adding creator
// ON THE OTHER HAND Slack group creator is assumed a member - THEN CAN SAY WHO DO YOU WANT TO INVITE
//TODO should display a UI because that's how group messaging in Slack works - you declare the people involved
// only difference there is you don't have to name
export function addGroupMembers(groupId, users) {
  return {
    type: ADD_GROUP_MEMBERS,
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
  const { groupId, userId } = action;
  const oldUsers = state[groupId] || [];
  const member = { id: userId, deleted: false, group_id: groupId, version: 1 };
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
    const oldUsersRaw = state[groupId] || [];
    const oldUsers = oldUsersRaw.filter((user) => user.fromQuickAdd);
    // Avoid clobbering what was quick added
    newState[groupId] = addByIdAndVersion(userDetails[groupId], oldUsers);
  });
  return removeInitializing(newState);
}

function computeNewState(state, action) {
  switch (action.type) {
    case INITIALIZE_STATE:
      return action.newState;
    case ADD_GROUP_MEMBER:
      return doAddGroupMember(state, action);
    case ADD_GROUP_MEMBERS:
      return doAddGroupMembers(state, action);
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
