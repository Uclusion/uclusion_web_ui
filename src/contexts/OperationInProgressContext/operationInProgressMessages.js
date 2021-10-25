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
    setState(event);
  });
}