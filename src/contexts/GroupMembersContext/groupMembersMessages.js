import {
  addGroupMember, addGroupMembers,
  versionsUpdateGroupMembers
} from './groupMembersContextReducer';
import { registerListener } from '../../utils/MessageBusUtils'
import {
  DEMO_EVENT,
  PUSH_MEMBER_CHANNEL,
  VERSIONS_EVENT
} from '../../api/versionedFetchUtils';

export const ADD_MEMBER = 'AddMember';

function beginListening(dispatch) {
  registerListener(PUSH_MEMBER_CHANNEL, 'groupMemberPushStart', (data) => {
    const { payload: { event, groupId, memberDetails, user, users } } = data;

    switch (event) {
      case VERSIONS_EVENT:
        dispatch(versionsUpdateGroupMembers(memberDetails));
        break;
      case DEMO_EVENT:
        dispatch(addGroupMembers(groupId, users, true));
        console.info('Responding to demo group member event');
        break;
      case ADD_MEMBER:
        dispatch(addGroupMember(groupId, user));
        break;
      default:
        // console.debug(`Ignoring push event ${event}`);
    }
  });
}

export default beginListening;

