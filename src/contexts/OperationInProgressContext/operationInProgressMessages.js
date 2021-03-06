/*
functions that let us turn on / off the spinner from messages
 */

import { registerListener } from '../../utils/MessageBusUtils';

export const START_OPERATION = 'start_operaation';
export const STOP_OPERATION = 'stop_operation';
export const OPERATION_HUB_CHANNEL = 'operation_in_progress';

export function beginListening(setState) {

  registerListener(OPERATION_HUB_CHANNEL, 'opListener', (data) => {
    const { payload: { event }} = data;
    switch (event) {
      case START_OPERATION:
        setState(true);
        break;
      case STOP_OPERATION:
        setState(false);
        break;
      default:
        // console.debug(`Operation in progres Ignoring event ${event}`);
    }
  });
}