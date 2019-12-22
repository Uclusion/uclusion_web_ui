import { getMarketDetails } from '../../api/markets';
import {
  PUSH_CONTEXT_CHANNEL,
  REMOVED_MARKETS_CHANNEL,
  VERSIONS_EVENT,
} from '../VersionsContext/versionsContextHelper';
import { removeMarketDetails, updateMarketDetails } from './marketsContextReducer';
import { AllSequentialMap } from '../../utils/PromiseUtils';
import { registerListener } from '../../utils/MessageBusUtils';

function beginListening(dispatch) {
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
          .then((marketDetails) => dispatch(updateMarketDetails(marketDetails)));
      }
      default:
        console.debug(`Ignoring identity event ${event}`);
    }
  });
}

export default beginListening;
