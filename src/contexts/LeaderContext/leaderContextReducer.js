import { refreshVersions } from '../VersionsContext/versionsContextHelper'
import { BroadcastChannel } from 'broadcast-channel'
import { LEADER_CHANNEL } from './LeaderContext'

const UPDATE_LEADER = 'update_leader';
const REFRESH_OR_MESSAGE = 'refresh_or_message';

export function updateLeader(isLeader) {
  return {
    type: UPDATE_LEADER,
    isLeader
  };
}

export function refreshOrMessage(peg) {
  return {
    type: REFRESH_OR_MESSAGE,
    peg
  };
}

function reducer(state, action) {
  switch (action.type) {
    case UPDATE_LEADER:
      const { isLeader } = action;
      console.info(`Setting leader to ${isLeader}`);
      return { isLeader };
    case REFRESH_OR_MESSAGE:
      const { isLeader: amLeader } = state;
      const { peg } = action;
      if (amLeader) {
        refreshVersions().then(() => console.info(`Refreshed versions from ${peg}`));
      } else if (amLeader !== undefined && !peg.includes('leaderChannel')) {
        console.info(`Not leader sending refresh from ${peg}`);
        const myChannel = new BroadcastChannel(LEADER_CHANNEL);
        myChannel.postMessage('refresh').then(() => myChannel.close());
      }
      return state;
    default:
      return state;
  }
}

export default reducer;