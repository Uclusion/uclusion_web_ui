import { versionsUpdateGroupMembers } from './groupMembersContextReducer';
import { registerListener } from '../../utils/MessageBusUtils';
import { PUSH_MEMBER_CHANNEL, VERSIONS_EVENT } from '../../api/versionedFetchUtils';

function beginListening(dispatch) {
  registerListener(PUSH_MEMBER_CHANNEL, 'groupMemberPushStart', (data) => {
    const { payload: { event, memberDetails } } = data;

    switch (event) {
      case VERSIONS_EVENT:
        dispatch(versionsUpdateGroupMembers(memberDetails));
        break;
      default:
        // console.debug(`Ignoring push event ${event}`);
    }
  });
}

export default beginListening;

