import { Hub } from '@aws-amplify/core';
import { refreshMarketPresence } from './marketPresencesHelper';
import {
  PUSH_PRESENCE_CHANNEL, REMOVED_MARKETS_CHANNEL,
  VERSIONS_EVENT
} from '../VersionsContext/versionsContextHelper';
import { removeMarketsPresence } from './marketPresencesContextReducer';
import { AllSequentialMap } from '../../utils/PromiseUtils';

function beginListening(dispatch) {
  Hub.listen(REMOVED_MARKETS_CHANNEL, (data) => {
    const { payload: { event, message } } = data;
    switch (event) {
      case VERSIONS_EVENT:
        dispatch(removeMarketsPresence(message));
        break;
      default:
        console.debug(`Ignoring identity event ${event}`);
    }
  });
  Hub.listen(PUSH_PRESENCE_CHANNEL, (data) => {
    const { payload: { event, message } } = data;

    switch (event) {
      case VERSIONS_EVENT: {
        return AllSequentialMap(message, (marketId) => refreshMarketPresence(dispatch, marketId));
      }
      default:
        console.debug(`Ignoring push event ${event}`);
    }
  });
}

export default beginListening;

