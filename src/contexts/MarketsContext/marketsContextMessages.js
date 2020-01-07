import { getMarketDetails } from '../../api/markets';
import {
  PUSH_CONTEXT_CHANNEL,
  REMOVED_MARKETS_CHANNEL,
  VERSIONS_EVENT,
} from '../VersionsContext/versionsContextHelper';
import { removeMarketDetails, updateMarketDetails, initializeState } from './marketsContextReducer';
import { AllSequentialMap } from '../../utils/PromiseUtils';
import { registerListener } from '../../utils/MessageBusUtils';
import { AUTH_HUB_CHANNEL } from '../WebSocketContext';
import { EMPTY_STATE } from './MarketsContext';
import { updateDiff } from '../DiffContext/diffContextReducer';

function beginListening(dispatch, diffDispatch) {
  registerListener(REMOVED_MARKETS_CHANNEL, 'marketsRemovedMarketStart', (data) => {
    const { payload: { event, message } } = data;
    switch (event) {
      case VERSIONS_EVENT:
        console.debug(`Markets context responding to updated market event ${event}`);
        dispatch(removeMarketDetails(message));
        break;
      default:
        console.debug(`Ignoring identity event ${event}`);
    }
  });
  registerListener(PUSH_CONTEXT_CHANNEL, 'marketsPushStart', (data) => {
    const { payload: { event, message } } = data;
    switch (event) {
      case VERSIONS_EVENT: {
        console.debug(`Markets context responding to updated market event ${event}`);
        return AllSequentialMap(message, (marketId) => getMarketDetails(marketId))
          .then((marketDetails) => {
            marketDetails.forEach((detail) => {
              diffDispatch(updateDiff(detail));
            });
            dispatch(updateMarketDetails(marketDetails));
          });
      }
      default:
        console.debug(`Ignoring identity event ${event}`);
    }
  });
  registerListener(AUTH_HUB_CHANNEL, 'marketsHubStart', (data) => {
    const { payload: { event } } = data;
    switch (event) {
      case 'signIn':
      case 'signOut':
        dispatch(initializeState(EMPTY_STATE));
        break;
      default:
        console.debug(`Ignoring event ${event}`);
    }
  });
}

export default beginListening;
