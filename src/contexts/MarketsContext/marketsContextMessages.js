import {
  PUSH_INVESTIBLES_CHANNEL,
  PUSH_MARKETS_CHANNEL, PUSH_PRESENCE_CHANNEL, PUSH_STAGE_CHANNEL,
  REMOVED_MARKETS_CHANNEL,
  VERSIONS_EVENT,
} from '../VersionsContext/versionsContextHelper'
import { removeMarketDetails } from './marketsContextReducer'
import { pushMessage, registerListener } from '../../utils/MessageBusUtils'
import { addMarketsToStorage, addMarketToStorage } from './marketsContextHelper'
import { getMarketFromInvite, getMarketFromUrl } from '../../api/uclusionClient'
import { toastError } from '../../utils/userMessage'
import { ADD_PRESENCE } from '../MarketPresencesContext/marketPresencesMessages'
import {
  OPERATION_HUB_CHANNEL,
  START_OPERATION,
  STOP_OPERATION
} from '../OperationInProgressContext/operationInProgressMessages'
import { lockPlanningMarketForEdit } from '../../api/markets'
import localforage from 'localforage'
import TokenStorageManager, { TOKEN_STORAGE_KEYSPACE, TOKEN_TYPE_MARKET } from '../../authorization/TokenStorageManager'
import { sendMarketsStruct, updateMarkets } from '../../api/versionedFetchUtils'

export const LOAD_MARKET_CHANNEL = 'LoadMarketChannel';
export const INVITE_MARKET_EVENT = 'InviteMarketEvent';
export const GUEST_MARKET_EVENT = 'GuestMarketEvent';
export const LOCK_MARKET_CHANNEL = 'LockMarketChannel';
export const LOCK_MARKET = 'LockMarket';
export const LOAD_TOKENS_CHANNEL = 'LoadTokensChannel';
export const LOAD_EVENT = 'LoadEvent'

function beginListening(dispatch, diffDispatch, setTokensHash) {
  registerListener(LOAD_TOKENS_CHANNEL, 'loadTokensStart', (data) => {
    const { payload: { event, key, token } } = data;
    switch (event) {
      case LOAD_EVENT:
        const localTokenHash = {[key]: token};
        //Try avoid dropping keys by adding the new one to what's on disk
        const store = localforage.createInstance({ storeName: TOKEN_STORAGE_KEYSPACE });
        store.iterate((value, key) => {
          localTokenHash[key] = value;
        }).then(() => setTokensHash(localTokenHash));
        break;
      default:
      // console.debug(`Ignoring identity event ${event}`);
    }
  });
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
        addMarketsToStorage(dispatch, diffDispatch, marketDetails);
        break;
      default:
        // console.debug(`Ignoring identity event ${event}`);
    }
  });
  registerListener(LOCK_MARKET_CHANNEL, 'marketsLockStart', (data) => {
    const { payload: { marketId } } = data;
    pushMessage(OPERATION_HUB_CHANNEL, { event: START_OPERATION, id: LOCK_MARKET });
    lockPlanningMarketForEdit(marketId).then((market) => {
      pushMessage(OPERATION_HUB_CHANNEL, { event: STOP_OPERATION, id: LOCK_MARKET });
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
        // Login with market id to create subscribed capability if necessary
        loginPromise = getMarketFromUrl(marketId, subscribeId);
        break;
      default:
      // console.debug(`Ignoring identity event ${event}`);
    }
    loginPromise.then((result) => {
      console.log('Quick adding market after load');
      const { market, user, stages, uclusion_token: token, investible } = result;
      const { id } = market;
      addMarketToStorage(dispatch, () => {}, market);
      pushMessage(PUSH_PRESENCE_CHANNEL, { event: ADD_PRESENCE, marketId: id, presence: user });
      pushMessage(PUSH_STAGE_CHANNEL, { event: VERSIONS_EVENT, marketId: id, stages });
      if (investible) {
        pushMessage(PUSH_INVESTIBLES_CHANNEL, { event: LOAD_EVENT, investibles: [investible] });
      }
      const tokenStorageManager = new TokenStorageManager();
      return tokenStorageManager.storeToken(TOKEN_TYPE_MARKET, id, token).then(() => {
        // We know the market we just logged into is dirty so skip normal call to check it first
        const marketsStruct = {};
        return updateMarkets([id], marketsStruct, 1)
          .then(() => sendMarketsStruct(marketsStruct));
      });
    }).catch((error) => {
      console.error(error);
      toastError('errorMarketFetchFailed');
    });
  });
}

export default beginListening;
