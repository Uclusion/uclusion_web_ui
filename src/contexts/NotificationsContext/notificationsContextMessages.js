import { pageChanged, updateMessages } from './notificationsContextReducer'
import { TOAST_CHANNEL, VIEW_EVENT, VISIT_CHANNEL } from './NotificationsContext'
import { NOTIFICATIONS_HUB_CHANNEL, VERSIONS_EVENT } from '../VersionsContext/versionsContextHelper'
import { registerListener } from '../../utils/MessageBusUtils'
import { getFullLink } from '../../components/Notifications/Notifications'
import { navigate } from '../../utils/marketIdPathFunctions'
import { RED_LEVEL, YELLOW_LEVEL } from '../../constants/notifications'
import { toast } from 'react-toastify'

function beginListening(dispatch, history) {
  registerListener(TOAST_CHANNEL, 'toastListener', (data) => {
    const { payload: message } = data;
    const { text, level, commentId, investibleId, marketId } = message
    const link = getFullLink(message);
    const objectId = commentId || investibleId || marketId;
    const toastId = `${objectId}_${text}`;
    const toastOptions = {
      onClick: () => navigate(history, link),
      toastId,
    };
    // don't pop an identical toast up for the same object
    if (toast.isActive(toastId)) {
      return;
    }
    switch(level) {
      case RED_LEVEL:
        return toast.error(text, toastOptions);
      case YELLOW_LEVEL:
        return toast.warn(text, toastOptions);
      default:
        /// should never happen, but just in case we don't want to lose a message
        return toast.info(text, toastOptions);
    }
  });

  registerListener(NOTIFICATIONS_HUB_CHANNEL, 'notificationsStart', (data) => {
    const { payload: { event, messages } } = data;
    // // console.debug(`Notifications context responding to push event ${event}`);

    switch (event) {
      case VERSIONS_EVENT:
        dispatch(updateMessages(messages));
        break;
      default:
        // console.debug(`Ignoring push event ${event}`);
    }
  });

  registerListener(VISIT_CHANNEL, 'notificationsVisitStart', (data) => {
    const { payload: { event, message } } = data;
    // console.debug(message);
    switch (event) {
      case VIEW_EVENT: {
        // we've navigated, the page is the message, so notify the store that the page changed
        dispatch(pageChanged(message));
        break;
      }
      default:
        // console.debug(`Ignoring event ${event}`);
    }
  });
}

export default beginListening;
