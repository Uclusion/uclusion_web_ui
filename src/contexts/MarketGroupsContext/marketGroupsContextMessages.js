import { registerListener } from '../../utils/MessageBusUtils';
import {
  PUSH_GROUPS_CHANNEL,
  VERSIONS_EVENT
} from '../../api/versionedFetchUtils';
import { addGroupsToStorage } from './marketGroupsContextHelper'

function beginListening(dispatch, diffDispatch) {
  registerListener(PUSH_GROUPS_CHANNEL, 'marketGroupsPushStart',  (data) => {
    const { payload: { event, groupDetails } } = data;
    switch (event) {
      case VERSIONS_EVENT:
        addGroupsToStorage(dispatch, diffDispatch, groupDetails);
        break;
      default:
        // console.debug(`Ignoring identity event ${event}`);
    }
  });
}

export default beginListening;
