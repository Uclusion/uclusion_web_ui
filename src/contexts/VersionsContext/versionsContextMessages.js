import {
  AUTH_HUB_CHANNEL,
  NOTIFICATION_MESSAGE_EVENT,
  VERSIONS_HUB_CHANNEL,
} from '../WebSocketContext';
import { getNotifications, getVersions } from '../../api/summaries';
import {
  addNewMarket,
  initializeState, initializeVersionsAction, loadingState, MY_STORED_EMPTY_STATE,
  refreshNotificationVersionAction,
  updateGlobalVersion
} from './versionsContextReducer'
import { registerListener } from '../../utils/MessageBusUtils';

export const GLOBAL_VERSION_UPDATE = 'global_version_update';
export const NEW_MARKET = 'new_market';

function beginListening(dispatch) {
  registerListener(AUTH_HUB_CHANNEL, 'versionAuthStart', (data) => {
    const { payload: { event } } = data;
    console.debug(`Versions context responding to auth event ${event}`);

    switch (event) {
      case 'signIn': {
        dispatch(loadingState());
        // An optimization would be to check if newly signed is same person
        getVersions().then((versions) => {
          dispatch(initializeVersionsAction(MY_STORED_EMPTY_STATE, versions));
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
    const { payload: { event, globalVersion, marketId } } = data;
    console.debug(`Versions context responding to push event ${event}`);
    switch (event) {
      case GLOBAL_VERSION_UPDATE:
        dispatch(updateGlobalVersion(globalVersion));
        break;
      case NEW_MARKET:
        dispatch(addNewMarket(marketId));
        break;
      case NOTIFICATION_MESSAGE_EVENT:
        return getNotifications()
          .then((notifications) => {
            const notification = notifications.find((item) => item.type_object_id.startsWith("notification"));
            dispatch(refreshNotificationVersionAction(notification));
          });
      default:
        console.debug(`Ignoring push event ${event}`);
    }
  });
}

export default beginListening;
