import { registerListener } from '../../utils/MessageBusUtils';
import { AUTH_HUB_CHANNEL } from '../WebSocketContext';
import { clearAccount } from './accountContextReducer';

export function beginListening (dispatch) {
  registerListener(AUTH_HUB_CHANNEL, 'accountContext', (data) => {
    const { payload: { event } } = data;
    switch (event) {
      case 'signIn':
        dispatch(clearAccount());
        break;
      case 'signOut':
        dispatch(clearAccount());
        break;
      default:
        console.log(`Unrecognized event ${event}`);
        break;
    }
  });
}