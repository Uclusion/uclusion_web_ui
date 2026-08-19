import _ from 'lodash'
import { removeInitializing } from '../../components/localStorageUtils'
import { addByIdAndVersion } from '../ContextUtils'
import { leaderContextHack } from '../LeaderContext/LeaderContext';
import LocalForageHelper from '../../utils/LocalForageHelper';
import { GROUP_MEMBERS_CONTEXT_NAMESPACE } from './GroupMembersContext';

const INITIALIZE_STATE = 'INITIALIZE_STATE';
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

export function addGroupMembers(marketId, groupId, users) {
  return {
    type: ADD_GROUP_MEMBERS,
    marketId,
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

function doAddGroupMembers(state, action) {
  const { groupId, users } = action;
  const oldUsers = state[groupId] || [];
  const newUsers = _.unionBy(users, oldUsers, 'id');
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
    const { isLeader } = leaderContextHack;
    if (isLeader) {
      presencesStoragePromiseChain = presencesStoragePromiseChain.then(() => {
        return lfh.setState(newState).then(() => {
          console.info('Updated members context storage.');
        });
      });
    }
  }
  return newState;
}

export default reducer;
