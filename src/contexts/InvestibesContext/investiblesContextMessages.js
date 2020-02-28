import { refreshInvestibles, removeInvestibles } from './investiblesContextHelper';
import {
  PUSH_INVESTIBLES_CHANNEL,
  VERSIONS_EVENT,
} from '../VersionsContext/versionsContextHelper';
import { registerListener } from '../../utils/MessageBusUtils';

export const REMOVE_INVESTIBLES = 'remove_investibles';

function beginListening(dispatch, diffDispatch) {
  registerListener(PUSH_INVESTIBLES_CHANNEL, 'pushInvestibleStart', (data) => {
    const { payload: { event, investibles } } = data;
    switch (event) {
      case VERSIONS_EVENT:
        return refreshInvestibles(dispatch, diffDispatch, investibles);
      case REMOVE_INVESTIBLES:
        return removeInvestibles(dispatch, diffDispatch, investibles);
      default:
        console.debug(`Ignoring push event ${event}`);
    }
  });
}

export default beginListening;