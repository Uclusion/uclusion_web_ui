import { Hub } from '@aws-amplify/core';

import { refreshMarketPresence } from './marketPresencesHelper';

function beginListening(dispatch) {
 /* Hub.listen(PUSH_PRESENCE_CHANNEL, (data) => {
    const { payload: { event, message } } = data;

    switch (event) {
        case MESSAGES_EVENT: {
        const { indirect_object_id: marketId } = message;
        console.debug(`Rerendered for push event ${event}`);
        refreshMarketPresence(dispatch, marketId);
        break;
      }
      default:
        console.debug(`Ignoring push event ${event}`);
    }
  });
  */

}

export default beginListening;

