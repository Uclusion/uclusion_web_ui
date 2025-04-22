const UPDATE_LEADER = 'update_leader';

export function updateLeader(isLeader) {
  return {
    type: UPDATE_LEADER,
    isLeader
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