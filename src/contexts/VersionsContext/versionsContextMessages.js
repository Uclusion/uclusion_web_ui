import { NOTIFICATION_MESSAGE_EVENT, VERSIONS_HUB_CHANNEL, } from '../WebSocketContext'
import { getNotifications } from '../../api/summaries'
import {
  refreshNotificationVersionAction,
  updateGlobalVersion,
} from './versionsContextReducer'
import { registerListener } from '../../utils/MessageBusUtils'

export const GLOBAL_VERSION_UPDATE = 'global_version_update';
export const NOTIFICATION_VERSION_UPDATE = 'notification_version_update';

function beginListening (dispatch) {
  registerListener(VERSIONS_HUB_CHANNEL, 'versionVersionStart', (data) => {
    const { payload: { event, globalVersion } } = data;
    // console.debug(`Versions context responding to push event ${event}`);
    switch (event) {
      case GLOBAL_VERSION_UPDATE:
        dispatch(updateGlobalVersion(globalVersion));
        break;
      case NOTIFICATION_MESSAGE_EVENT:
        return getNotifications()
          .then((notifications) => {
            const notification = notifications.find((item) => item.type_object_id.startsWith('notification'));
            dispatch(refreshNotificationVersionAction(notification));
          });
      default:
      // console.debug(`Ignoring push event ${event}`);
    }
  });
}

export default beginListening;
