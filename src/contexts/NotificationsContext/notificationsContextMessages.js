import { addMessage, removeMessage, removeMessagesForInvestible, updateMessages } from './notificationsContextReducer'
import { NOTIFICATIONS_HUB_CHANNEL, VERSIONS_EVENT } from '../VersionsContext/versionsContextHelper'
import { registerListener } from '../../utils/MessageBusUtils'
import { getMarketClient } from '../../api/uclusionClient'

export const ADD_EVENT = 'add_event';
export const DELETE_EVENT = 'delete_event';
export const DEHIGHLIGHT_EVENT = 'dehighlight_event';
export const MODIFY_NOTIFICATIONS_CHANNEL = 'delete_notifications';
export const STAGE_CHANGE_EVENT = 'stage_change_event';
export const REMOVE_EVENT = 'remove_event';

function beginListening(dispatch) {
  registerListener(NOTIFICATIONS_HUB_CHANNEL, 'notificationsStart', (data) => {
    const { payload: { event, messages, message } } = data;
    // // console.debug(`Notifications context responding to push event ${event}`);

    switch (event) {
      case VERSIONS_EVENT:
        dispatch(updateMessages(messages));
        break;
      case ADD_EVENT:
        dispatch(addMessage(message));
        break;
      default:
        // console.debug(`Ignoring push event ${event}`);
    }
  });
  registerListener(MODIFY_NOTIFICATIONS_CHANNEL, 'notificationsDelete', (data) => {
    const { payload: { event, messages, investibleId, useRemoveTypes, message } } = data;
    let marketId;
    let typeObjectIds = [];
    messages.forEach((message) => {
      marketId = message.market_id;
      typeObjectIds.push(message.type_object_id);
    })
    switch (event) {
      case DELETE_EVENT:
        getMarketClient(marketId).then((client) => client.users.removeNotifications(typeObjectIds));
        break;
      case DEHIGHLIGHT_EVENT:
        getMarketClient(marketId).then((client) => client.users.dehighlightNotifications(typeObjectIds));
        break;
      case STAGE_CHANGE_EVENT:
        dispatch(removeMessagesForInvestible(investibleId, useRemoveTypes));
        break;
      case REMOVE_EVENT:
        dispatch(removeMessage(message));
        break;
      default:
      // console.debug(`Ignoring push event ${event}`);
    }
  });
}

export default beginListening;
