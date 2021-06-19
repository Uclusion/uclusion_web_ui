import {
  PUSH_MARKETS_CHANNEL, PUSH_PRESENCE_CHANNEL,
  REMOVED_MARKETS_CHANNEL,
  VERSIONS_EVENT,
} from '../VersionsContext/versionsContextHelper'
import { removeMarketDetails } from './marketsContextReducer'
import { pushMessage, registerListener } from '../../utils/MessageBusUtils'
import { addMarketToStorage } from './marketsContextHelper'
import { getMarketFromInvite, getMarketFromUrl } from '../../api/uclusionClient'
import { createMarketListeners, pollForMarketLoad } from '../../api/versionedFetchUtils'
import { toastError } from '../../utils/userMessage'
import { ADD_PRESENCE } from '../MarketPresencesContext/marketPresencesMessages'
import {
  OPERATION_HUB_CHANNEL,
  START_OPERATION,
  STOP_OPERATION
} from '../OperationInProgressContext/operationInProgressMessages'
import { lockPlanningMarketForEdit } from '../../api/markets'

export const LOAD_MARKET_CHANNEL = 'LoadMarketChannel';
export const INVITE_MARKET_EVENT = 'InviteMarketEvent';
export const GUEST_MARKET_EVENT = 'GuestMarketEvent';
export const LOCK_MARKET_CHANNEL = 'LockMarketChannel';
export const LOCK_MARKET = 'LockMarket';

function beginListening(dispatch, diffDispatch) {
  registerListener(REMOVED_MARKETS_CHANNEL, 'marketsRemovedMarketStart', (data) => {
    const { payload: { event, message } } = data;
    switch (event) {
      case VERSIONS_EVENT:
        // console.debug(`Markets context responding to updated market event ${event}`);
        dispatch(removeMarketDetails(message));
        break;
      default:
        // console.debug(`Ignoring identity event ${event}`);
    }
  });
  registerListener(PUSH_MARKETS_CHANNEL, 'marketsPushStart', (data) => {
    const { payload: { event, marketDetails } } = data;
    switch (event) {
      case VERSIONS_EVENT:
        // console.debug(`Markets context responding to updated market event ${event}`);
        addMarketToStorage(dispatch, diffDispatch, marketDetails, true);
        break;
      default:
        // console.debug(`Ignoring identity event ${event}`);
    }
  });
  registerListener(LOCK_MARKET_CHANNEL, 'marketsLockStart', (data) => {
    const { payload: { marketId } } = data;
    pushMessage(OPERATION_HUB_CHANNEL, { event: START_OPERATION });
    lockPlanningMarketForEdit(marketId).then((market) => {
      pushMessage(OPERATION_HUB_CHANNEL, { event: STOP_OPERATION });
      addMarketToStorage(dispatch, diffDispatch, market);
    });
  });
  registerListener(LOAD_MARKET_CHANNEL, 'marketsLoadStart', (data) => {
    const { payload: { event, marketToken, marketId, subscribeId } } = data;
    let loginPromise;
    switch (event) {
      case INVITE_MARKET_EVENT:
        loginPromise = getMarketFromInvite(marketToken);
        break;
      case GUEST_MARKET_EVENT:
        // Login with market id to create guest capability if necessary
        loginPromise = getMarketFromUrl(marketId, subscribeId);
        break;
      default:
      // console.debug(`Ignoring identity event ${event}`);
    }
    pushMessage(OPERATION_HUB_CHANNEL, { event: START_OPERATION });
    loginPromise.then((result) => {
      console.log('Quick adding market after load');
      const { market, user } = result;
      const { id } = market;
      addMarketToStorage(dispatch, () => {}, market);
      pushMessage(PUSH_PRESENCE_CHANNEL, { event: ADD_PRESENCE, marketId: id, presence: user });
      createMarketListeners(id);
      return pollForMarketLoad(id);
    }).catch((error) => {
      console.error(error);
      toastError('errorMarketFetchFailed');
    });
  });
}

export default beginListening;
