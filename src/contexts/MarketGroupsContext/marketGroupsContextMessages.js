import { removeMarketsGroupsDetails, updateMarketGroupsFromNetwork } from './marketGroupsContextReducer';
import { registerListener } from '../../utils/MessageBusUtils';
import {
  PUSH_GROUPS_CHANNEL,
  REMOVED_MARKETS_CHANNEL,
  VERSIONS_EVENT
} from '../../api/versionedFetchUtils';

function beginListening(dispatch) {
  registerListener(REMOVED_MARKETS_CHANNEL, 'marketGroupsRemovedMarketStart', (data) => {
    const { payload: { event, message } } = data;
    switch (event) {
      case VERSIONS_EVENT:
        // console.debug(`Stages context responding to updated market event ${event}`);
        dispatch(removeMarketsGroupsDetails(message));
        break;
      default:
        // console.debug(`Ignoring identity event ${event}`);
    }
  });
  registerListener(PUSH_GROUPS_CHANNEL, 'marketGroupsPushStart',  (data) => {
    const { payload: { event, groupDetails } } = data;
    switch (event) {
      case VERSIONS_EVENT:
        dispatch(updateMarketGroupsFromNetwork(groupDetails));
        break;
      default:
        // console.debug(`Ignoring identity event ${event}`);
    }
  });
}

export default beginListening;
