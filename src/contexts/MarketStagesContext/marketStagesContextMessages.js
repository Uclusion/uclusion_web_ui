import {
  PUSH_STAGE_CHANNEL,
  REMOVED_MARKETS_CHANNEL,
  VERSIONS_EVENT,
} from '../VersionsContext/versionsContextHelper';
import { removeMarketsStageDetails, updateMarketStagesFromNetwork } from './marketStagesContextReducer';
import { registerListener } from '../../utils/MessageBusUtils';

function beginListening(dispatch) {
  registerListener(REMOVED_MARKETS_CHANNEL, 'marketStagesRemovedMarketStart', (data) => {
    const { payload: { event, message } } = data;
    switch (event) {
      case VERSIONS_EVENT:
        // console.debug(`Stages context responding to updated market event ${event}`);
        dispatch(removeMarketsStageDetails(message));
        break;
      default:
        // console.debug(`Ignoring identity event ${event}`);
    }
  });
  registerListener(PUSH_STAGE_CHANNEL, 'marketStagesPushStart',  (data) => {
    const { payload: { event, stageDetails } } = data;
    switch (event) {
      case VERSIONS_EVENT:
        dispatch(updateMarketStagesFromNetwork(stageDetails));
        break;
      default:
        // console.debug(`Ignoring identity event ${event}`);
    }
  });
}

export default beginListening;
