import { Hub } from '@aws-amplify/core';
import { refreshMarketComments } from './commentsContextHelper';
import {
  PUSH_COMMENTS_CHANNEL,
  REMOVED_MARKETS_CHANNEL,
  VERSIONS_EVENT
} from '../VersionsContext/versionsContextHelper';
import { removeMarketsComments } from './commentsContextReducer';
import { AllSequential } from '../../utils/PromiseUtils';

function beginListening(dispatch) {
  Hub.listen(REMOVED_MARKETS_CHANNEL, (data) => {
    const { payload: { event, message } } = data;
    switch (event) {
      case VERSIONS_EVENT:
        dispatch(removeMarketsComments(message));
        break;
      default:
        console.debug(`Ignoring identity event ${event}`);
    }
  });
  Hub.listen(PUSH_COMMENTS_CHANNEL, (data) => {
    const { payload: { event, message } } = data;

    switch (event) {
      case VERSIONS_EVENT: {
        const promises = message.map((marketId) => refreshMarketComments(dispatch, marketId));
        return AllSequential(promises);
      }
      default:
        console.debug(`Ignoring push event ${event}`);
    }
  });
}

export default beginListening;
