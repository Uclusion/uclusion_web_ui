const UPDATE_LEADER = 'update_leader';
const REFRESH_OR_MESSAGE = 'refresh_or_message';

export function updateLeader(isLeader) {
  return {
    type: UPDATE_LEADER,
    isLeader
  };
}

export function refreshOrMessage(peg, leaderChannelId) {
  return {
    type: REFRESH_OR_MESSAGE,
    leaderChannelId,
    peg
  };
}

function reducer(state, action) {
  switch (action.type) {
    case UPDATE_LEADER:
      const { isLeader } = action;
      console.info(`Setting leader to ${isLeader}`);
      return { isLeader };
    default:
      return state;
  }
}

export default reducer;