import { registerListener } from '../../utils/MessageBusUtils';
import { PUSH_GROUPS_CHANNEL, VERSIONS_EVENT } from '../../api/versionedFetchUtils';
import { addGroupsToStorage } from './marketGroupsContextHelper';

function beginListening(dispatch) {
  registerListener(PUSH_GROUPS_CHANNEL, 'marketGroupsPushStart',  (data) => {
    const { payload: { event, groupDetails } } = data;
    switch (event) {
      case VERSIONS_EVENT:
        addGroupsToStorage(dispatch, groupDetails);
        break;
      default:
        // console.debug(`Ignoring identity event ${event}`);
    }
  });
}

export default beginListening;
