import { pushMessage } from './MessageBusUtils'
import {
  OPERATION_HUB_CHANNEL,
  STOP_OPERATION
} from '../contexts/OperationInProgressContext/operationInProgressMessages'

/**
 * Calls the execFunction every waitTime for up to maxIterations time.
 * The first iteration occurs after 1 wait time period has lapsed
 * @param waitTime the time in millis between executions of the check function - note this is just the whitespace between,
 * the timer won't start until the cbeckFunction finishes
 * @param maxIterations, the maximum number of times to call the check function
 * @param execFunction a function that is executed every waitTime milliseconds unless the timer is cleared
 * @returns a function that if called stops the timer
 */
export function startTimerChain (waitTime, maxIterations, execFunction) {
  let iterCount = 0;
  function callFunc() {
    Promise.resolve(execFunction())
      .then((success) => {
        if (success || iterCount >= maxIterations) {
          if (!success) {
            console.warn('Stopping global timer chain after max iterations');
            pushMessage(OPERATION_HUB_CHANNEL, { event: STOP_OPERATION });
          }
          return;
        }
        // console.log('Call failed, resuming chain');
        iterCount += 1;
        setTimeout(callFunc, waitTime);
      });
  }
  setTimeout(callFunc, 0);
}

export function isInPast(someDate) {
  const today = new Date();
  return today.getTime() - someDate.getTime() > 0;
}

export function getTomorrow() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
}
