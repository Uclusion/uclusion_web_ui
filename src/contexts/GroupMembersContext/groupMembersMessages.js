import {
  addGroupMember,
  versionsUpdateGroupMembers
} from './groupMembersContextReducer'
import { registerListener } from '../../utils/MessageBusUtils'
import {
  PUSH_MEMBER_CHANNEL,
  VERSIONS_EVENT
} from '../../api/versionedFetchUtils'

export const ADD_MEMBER = 'AddMember';

function beginListening(dispatch) {
  registerListener(PUSH_MEMBER_CHANNEL, 'groupMemberPushStart', (data) => {
    const { payload: { event, groupId, userDetails, user } } = data;

    switch (event) {
      case VERSIONS_EVENT:
        dispatch(versionsUpdateGroupMembers(userDetails));
        break;
      case ADD_MEMBER:
        addGroupMember(dispatch, groupId, user);
        break;
      default:
        // console.debug(`Ignoring push event ${event}`);
    }
  });
}

export default beginListening;

