import { Hub } from '@aws-amplify/core';
import { MESSAGES_EVENT, PUSH_COMMENTS_CHANNEL } from '../WebSocketContext';
import { refreshMarketComments } from './commentsContextHelper';

function beginListening(dispatch) {
  Hub.listen(PUSH_COMMENTS_CHANNEL, (data) => {
    const { payload: { event, message } } = data;

    switch (event) {
      case MESSAGES_EVENT: {
        const { indirect_object_id: marketId } = message;
        refreshMarketComments(dispatch, marketId);
        break;
      }
      default:
        console.debug(`Ignoring push event ${event}`);
    }
  });
}

export default beginListening;
