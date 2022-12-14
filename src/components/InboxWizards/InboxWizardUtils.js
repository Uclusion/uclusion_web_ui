import {
  DEHIGHLIGHT_EVENT,
  DELETE_EVENT,
  MODIFY_NOTIFICATIONS_CHANNEL
} from '../../contexts/NotificationsContext/notificationsContextMessages'
import { pushMessage } from '../../utils/MessageBusUtils'
import { formInvestibleLink, navigate } from '../../utils/marketIdPathFunctions'

export function wizardFinish(formData, setOperationRunning, message, history, marketId, investibleId) {
  setOperationRunning(false);
  let event = DEHIGHLIGHT_EVENT;
  if (message.type_object_id.startsWith('UNREAD')) {
    event = DELETE_EVENT;
  }
  pushMessage(MODIFY_NOTIFICATIONS_CHANNEL, { event, message: (message.id || message.type_object_id) });
  let link = formInvestibleLink(marketId, investibleId);
  if (formData) {
    const { link: passedLink } = formData;
    if (passedLink) {
      link = passedLink;
    }
  }
  navigate(history, link);
}