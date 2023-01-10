import {
  DEHIGHLIGHT_EVENT,
  DELETE_EVENT,
} from '../../contexts/NotificationsContext/notificationsContextMessages'
import { formInvestibleLink, navigate } from '../../utils/marketIdPathFunctions'
import { modifyNotifications } from '../../pages/Home/YourWork/WorkListItem';

export function wizardFinish(formData, setOperationRunning, message, history, marketId, investibleId,
  messagesDispatch) {
  setOperationRunning(false);
  let event = DEHIGHLIGHT_EVENT;
  if (message.type_object_id.startsWith('UNREAD')) {
    event = DELETE_EVENT;
  }
  modifyNotifications(event, message.id || message.type_object_id, messagesDispatch, message)
  let link = formInvestibleLink(marketId, investibleId);
  if (formData) {
    const { link: passedLink } = formData;
    if (passedLink) {
      link = passedLink;
    }
  }
  navigate(history, link);
}