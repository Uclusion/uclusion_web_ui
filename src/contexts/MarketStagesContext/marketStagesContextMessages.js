import {
  PUSH_STAGE_CHANNEL,
  REMOVED_MARKETS_CHANNEL,
  VERSIONS_EVENT,
} from '../VersionsContext/versionsContextHelper';
import { refreshMarketStages } from './marketStagesContextHelper';
import { removeMarketsStageDetails, initializeState } from './marketStagesContextReducer';
import { registerListener } from '../../utils/MessageBusUtils';
import { AUTH_HUB_CHANNEL } from '../WebSocketContext';
import { EMPTY_STATE } from './MarketStagesContext';
import { getUclusionLocalStorageItem } from '../../components/utils';

function beginListening(dispatch) {
  registerListener(REMOVED_MARKETS_CHANNEL, 'marketStagesRemovedMarketStart', (data) => {
    const { payload: { event, message } } = data;
    switch (event) {
      case VERSIONS_EVENT:
        console.debug(`Stages context responding to updated market event ${event}`);
        dispatch(removeMarketsStageDetails(message));
        break;
      default:
        console.debug(`Ignoring identity event ${event}`);
    }
  });
  registerListener(PUSH_STAGE_CHANNEL, 'marketStagesPushStart',  (data) => {
    const { payload: { event, message } } = data;
    switch (event) {
      case VERSIONS_EVENT: {
        console.debug(`Stages context responding to updated market event ${event}`);
        refreshMarketStages(dispatch, message);
        break;
      }
      default:
        console.debug(`Ignoring identity event ${event}`);
    }
  });
  registerListener(AUTH_HUB_CHANNEL, 'marketStagesHubStart', (data) => {
    const { payload: { event, data: { username } } } = data;
    switch (event) {
      case 'signIn':
        const oldUserName = getUclusionLocalStorageItem('userName');
        if (oldUserName !== username) {
          dispatch(initializeState(EMPTY_STATE));
        }
        break;
      case 'signOut':
        dispatch(initializeState(EMPTY_STATE));
        break;
      default:
        console.debug(`Ignoring event ${event}`);
    }
  });
}

export default beginListening;
