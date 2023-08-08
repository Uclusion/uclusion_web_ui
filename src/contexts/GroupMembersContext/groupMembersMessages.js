import {
  addGroupMember,
  versionsUpdateGroupMembers
} from './groupMembersContextReducer'
import { registerListener } from '../../utils/MessageBusUtils'
import {
  DEMO_EVENT,
  PUSH_MEMBER_CHANNEL,
  VERSIONS_EVENT
} from '../../api/versionedFetchUtils';

export const ADD_MEMBER = 'AddMember';

function beginListening(dispatch) {
  registerListener(PUSH_MEMBER_CHANNEL, 'groupMemberPushStart', (data) => {
    const { payload: { event, groupId, memberDetails, user } } = data;

    switch (event) {
      case VERSIONS_EVENT:
        dispatch(versionsUpdateGroupMembers(memberDetails));
        break;
      case DEMO_EVENT:
        console.info('Responding to demo group member event');
      // eslint-disable-next-line no-fallthrough
      case ADD_MEMBER:
        dispatch(addGroupMember(groupId, user));
        break;
      default:
        // console.debug(`Ignoring push event ${event}`);
    }
  });
}

export default beginListening;

