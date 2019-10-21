import { Hub } from '@aws-amplify/core';
import { MESSAGES_EVENT, PUSH_INVESTIBLES_CHANNEL } from '../WebSocketContext';
import { refreshInvestibles } from './investiblesContextHelper';

function beginListening(dispatch) {
  Hub.listen(PUSH_INVESTIBLES_CHANNEL, (data) => {
    const { payload: { event, message } } = data;

    switch (event) {
      case MESSAGES_EVENT: {
        const { indirect_object_id: marketId } = message;
        refreshInvestibles(dispatch, marketId);
        break;
      }
      default:
        console.debug(`Ignoring push event ${event}`);
    }
  });
}

export default beginListening;