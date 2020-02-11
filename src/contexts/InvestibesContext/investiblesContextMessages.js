import { refreshInvestibles } from './investiblesContextHelper';
import {
  PUSH_INVESTIBLES_CHANNEL,
  VERSIONS_EVENT,
} from '../VersionsContext/versionsContextHelper';
import { registerListener } from '../../utils/MessageBusUtils';
import { AUTH_HUB_CHANNEL } from '../WebSocketContext';
import { initializeState } from './investiblesContextReducer';
import { EMPTY_STATE } from './InvestiblesContext';
import { getUclusionLocalStorageItem } from '../../components/utils';

function beginListening(dispatch, diffDispatch) {
  registerListener(PUSH_INVESTIBLES_CHANNEL, 'pushInvestibleStart', (data) => {
    const { payload: { event, marketId, investibles } } = data;
    switch (event) {
      case VERSIONS_EVENT:
        return refreshInvestibles(dispatch, diffDispatch, marketId, investibles);
      default:
        console.debug(`Ignoring push event ${event}`);
    }
  });
  registerListener(AUTH_HUB_CHANNEL, 'investiblesHubStart', (data) => {
    const { payload: { event, data: { username } } } = data;
    switch (event) {
      case 'signIn':
        const oldUserName = getUclusionLocalStorageItem('userName');
        if (oldUserName !== username) {
          dispatch(initializeState(EMPTY_STATE));
        }
        break;
      case 'signOut':
        dispatch(initializeState(EMPTY_STATE));
        break;
      default:
        console.debug(`Ignoring event ${event}`);
    }
  });
}

export default beginListening;