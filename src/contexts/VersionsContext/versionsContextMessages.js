import {
  AUTH_HUB_CHANNEL,
  NOTIFICATION_MESSAGE_EVENT,
  VERSIONS_HUB_CHANNEL,
} from '../WebSocketContext';
import { getVersions } from '../../api/summaries';
import {
  EMPTY_STATE,
  initializeState, initializeVersionsAction, loadingState,
  refreshNotificationVersionAction,
  updateGlobalVersion
} from './versionsContextReducer';
import { registerListener } from '../../utils/MessageBusUtils';

export const GLOBAL_VERSION_UPDATE = 'global_version_update';

function beginListening(dispatch) {
  registerListener(AUTH_HUB_CHANNEL, 'versionAuthStart', (data) => {
    const { payload: { event } } = data;
    console.debug(`Versions context responding to auth event ${event}`);

    switch (event) {
      case 'signIn': {
        dispatch(loadingState());
        // An optimization would be to check if newly signed is same person
        getVersions().then((versions) => {
          dispatch(initializeVersionsAction(EMPTY_STATE, versions));
        });
        break;
      }
      case 'signOut':
        dispatch(initializeState());
        break;
      default:
        console.debug(`Ignoring auth event ${event}`);
    }
  });

  registerListener(VERSIONS_HUB_CHANNEL, 'versionVersionStart', (data) => {
    const { payload: { event, globalVersion } } = data;
    console.debug(`Versions context responding to push event ${event}`);
    switch (event) {
      case GLOBAL_VERSION_UPDATE:
        console.log(globalVersion);
        dispatch(updateGlobalVersion(globalVersion));
        break;
      case NOTIFICATION_MESSAGE_EVENT:
        dispatch(refreshNotificationVersionAction());
        break;
      default:
        console.debug(`Ignoring push event ${event}`);
    }
  });
}

export default beginListening;
