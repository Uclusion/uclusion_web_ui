import { registerListener } from '../../utils/MessageBusUtils';
import { PUSH_HOME_USER_CHANNEL, VERSIONS_EVENT } from '../VersionsContext/versionsContextHelper';
import { homeUserRefresh } from '../AccountContext/accountContextReducer';

export function beginListening (dispatch) {
  registerListener(PUSH_HOME_USER_CHANNEL, 'accountHomeUser', (data) => {
    const { payload: { event, user } } = data;
    switch (event) {
      case VERSIONS_EVENT:
        dispatch(homeUserRefresh(user));
      default:
        break;
    }
  });
}