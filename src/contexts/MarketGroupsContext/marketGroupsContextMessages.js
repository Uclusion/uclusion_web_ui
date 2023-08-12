import { registerListener } from '../../utils/MessageBusUtils';
import { DEMO_EVENT, PUSH_GROUPS_CHANNEL, VERSIONS_EVENT } from '../../api/versionedFetchUtils';
import { addGroupsToStorage, addGroupToStorage } from './marketGroupsContextHelper';

function beginListening(dispatch, diffDispatch) {
  registerListener(PUSH_GROUPS_CHANNEL, 'marketGroupsPushStart',  (data) => {
    const { payload: { event, groupDetails } } = data;
    switch (event) {
      case DEMO_EVENT:
        // the group id of the demo group is the same as the market id
        addGroupToStorage(dispatch, groupDetails.id, groupDetails);
        break;
      case VERSIONS_EVENT:
        addGroupsToStorage(dispatch, diffDispatch, groupDetails);
        break;
      default:
        // console.debug(`Ignoring identity event ${event}`);
    }
  });
}

export default beginListening;
