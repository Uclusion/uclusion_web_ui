import { pushMessage } from './MessageBusUtils'
import {
  OPERATION_HUB_CHANNEL,
  STOP_OPERATION
} from '../contexts/OperationInProgressContext/operationInProgressMessages'


export function isInPast(someDate) {
  if (!someDate) {
    return false;
  }
  const today = new Date();
  return today.getTime() - someDate.getTime() > 0;
}
