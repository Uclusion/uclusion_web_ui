import { registerListener } from '../../utils/MessageBusUtils';
import { accountUserRefresh } from './accountUserContextReducer';
import { PUSH_HOME_USER_CHANNEL, VERSIONS_EVENT } from '../../api/versionedFetchUtils'


export function beginListening (dispatch) {
  registerListener(PUSH_HOME_USER_CHANNEL, 'accountHomeUser', (data) => {
    const { payload: { event, user } } = data;
    switch (event) {
      case VERSIONS_EVENT:
        dispatch(accountUserRefresh(user));
        break;
      default:
        break;
    }
  });
}