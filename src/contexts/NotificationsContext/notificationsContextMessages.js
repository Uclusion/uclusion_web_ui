import { getMessages } from '../../api/sso';
import { updateMessages, remove, pageChanged } from './notificationsContextReducer';
import { TOAST_CHANNEL, VIEW_EVENT, VISIT_CHANNEL } from './NotificationsContext';
import { NOTIFICATIONS_HUB_CHANNEL, VERSIONS_EVENT } from '../VersionsContext/versionsContextHelper'
import { registerListener } from '../../utils/MessageBusUtils';
import { REMOVE_EVENT } from '../WebSocketContext';
import { getFullLink } from '../../components/Notifications/Notifications';
import { navigate } from '../../utils/marketIdPathFunctions';
import { RED_LEVEL, YELLOW_LEVEL } from '../../constants/notifications';
import { toast } from 'react-toastify';

function beginListening(dispatch, history) {
  registerListener(TOAST_CHANNEL, 'toastListener', (data) => {
    const { payload: { message }} = data;
    const { text, level } = message
    const link = getFullLink(message);
    const toastOptions = { onClick: () => navigate(history, link)}
    switch(level) {
      case RED_LEVEL:
        return toast.error(text, toastOptions);
      case YELLOW_LEVEL:
        return toast.warn(text, toastOptions);
      default:
        /// should never happen, but just in case we don't want to lose a message
        return toast.info(text, toastOptions);
    }
  })

  registerListener(NOTIFICATIONS_HUB_CHANNEL, 'notificationsStart', (data) => {
    const { payload: { event, hkey, rkey } } = data;
    // // console.debug(`Notifications context responding to push event ${event}`);

    switch (event) {
      case VERSIONS_EVENT:
        getMessages().then((messages) => {
          const stale = messages.find((message) => (message.type_object_id === rkey
            && message.market_id_user_id === hkey));
          if (!stale) {
            // Messages are reading from an index so can't consistent read and nothing like versions
            // to say exactly what looking for. So if retrieved stale then just ignore and hope to get updated later.
            return dispatch(updateMessages(messages));
          }
        });
        break;
      case REMOVE_EVENT:
        dispatch(remove(hkey, rkey));
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
        const { marketId, investibleId, isEntry, action } = message;
        // we've navigated, check the store for any messages that we can service
        dispatch(pageChanged({ marketId, investibleId, action}));
        break;
      }
      default:
        // console.debug(`Ignoring event ${event}`);
    }
  });
}

export default beginListening;
