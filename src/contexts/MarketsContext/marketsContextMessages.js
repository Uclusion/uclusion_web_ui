import { Hub } from '@aws-amplify/core';
import {
  AUTH_HUB_CHANNEL,
  INVITED_TO_NEW_MARKET_EVENT,
  MESSAGES_EVENT,
  PUSH_CONTEXT_CHANNEL
} from '../WebSocketContext';
import { refreshMarkets, clearState } from './marketsContextHelper';
import { getMarketDetails } from '../../api/markets';
import { updateSingleMarketDetails } from './marketsContextReducer';

function beginListening(dispatch) {
  Hub.listen(AUTH_HUB_CHANNEL, (data) => {
    const { payload: { event } } = data;
    console.debug(`Markets context responding to auth event ${event}`);
    switch (event) {
      case 'signIn':
        refreshMarkets(dispatch);
        break;
      case 'signOut':
        clearState(dispatch);
        break;
      default:
        console.debug(`Ignoring auth event ${event}`);
    }
  });
  Hub.listen(PUSH_CONTEXT_CHANNEL, (data) => {
    const { payload: { event, message } } = data;
    switch (event) {
      case INVITED_TO_NEW_MARKET_EVENT:
        refreshMarkets(dispatch);
        break;
      case MESSAGES_EVENT:
        console.debug(`Markets context responding to updated market event ${event}`);
        getMarketDetails(message.object_id).then((marketDetails) => {
          return dispatch(updateSingleMarketDetails(marketDetails));
        });
        break;
      default:
        console.debug(`Ignoring identity event ${event}`);
    }
  });
}

export default beginListening;