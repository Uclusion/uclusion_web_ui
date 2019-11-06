import { Hub } from '@aws-amplify/core';
import { refreshInvestibles } from './investiblesContextHelper';
import {
  PUSH_INVESTIBLES_CHANNEL,
  VERSIONS_EVENT,
} from '../VersionsContext/versionsContextHelper';
import { AllSequential } from '../../utils/PromiseUtils';

function beginListening(dispatch) {
  Hub.listen(PUSH_INVESTIBLES_CHANNEL, (data) => {
    const { payload: { event, message } } = data;

    switch (event) {
      case VERSIONS_EVENT: {
        const promises = message.map((marketId) => refreshInvestibles(dispatch, marketId));
        return AllSequential(promises);
      }
      default:
        console.debug(`Ignoring push event ${event}`);
    }
  });
}

export default beginListening;