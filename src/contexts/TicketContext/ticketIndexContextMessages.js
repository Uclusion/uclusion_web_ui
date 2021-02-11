import { registerListener } from '../../utils/MessageBusUtils';

export const TICKET_INDEX_CHANNEL = 'TICKET_INDEX_CHANNEL';

export function beginListening(dispatch) {
  registerListener(TICKET_INDEX_CHANNEL, 'ticketIndexUpdater', (data) => {
    const { payload } = data;
    dispatch({items: payload});
  });
}