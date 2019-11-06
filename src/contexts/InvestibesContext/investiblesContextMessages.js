import { Hub } from '@aws-amplify/core';
import { refreshInvestibles } from './investiblesContextHelper';
import {
  PUSH_INVESTIBLES_CHANNEL,
  VERSIONS_EVENT,
} from '../VersionsContext/versionsContextHelper';

function beginListening(dispatch) {
  Hub.listen(PUSH_INVESTIBLES_CHANNEL, (data) => {
    const { payload: { event, message } } = data;

    switch (event) {
      case VERSIONS_EVENT: {
        message.map((marketId) => refreshInvestibles(dispatch, marketId));
        break;
      }
      default:
        console.debug(`Ignoring push event ${event}`);
    }
  });
}

export default beginListening;