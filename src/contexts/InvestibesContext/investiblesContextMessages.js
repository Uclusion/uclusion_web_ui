import { refreshInvestibles } from './investiblesContextHelper';
import {
  PUSH_INVESTIBLES_CHANNEL,
  VERSIONS_EVENT,
} from '../VersionsContext/versionsContextHelper';
import { AllSequentialMap } from '../../utils/PromiseUtils';
import { registerListener } from '../../utils/MessageBusUtils';

function beginListening(dispatch) {
  registerListener(PUSH_INVESTIBLES_CHANNEL, 'pushInvestibleStart', (data) => {
    const { payload: { event, message } } = data;

    switch (event) {
      case VERSIONS_EVENT: {
        return AllSequentialMap(message, (marketId) => refreshInvestibles(dispatch, marketId));
      }
      default:
        console.debug(`Ignoring push event ${event}`);
    }
  });
}

export default beginListening;