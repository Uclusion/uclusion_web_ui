import { addSyncError, removeMarketDetails } from './marketsContextReducer'
import { pushMessage, registerListener } from '../../utils/MessageBusUtils'
import { addMarketsToStorage, addMarketToStorage } from './marketsContextHelper'
import { getMarketFromInvite, getMarketFromUrl } from '../../api/marketLogin'
import { toastError } from '../../utils/userMessage'
import { ADD_PRESENCE } from '../MarketPresencesContext/marketPresencesMessages'
import localforage from 'localforage'
import TokenStorageManager from '../../authorization/TokenStorageManager'
import { TOKEN_STORAGE_KEYSPACE, TOKEN_TYPE_MARKET }  from '../../api/tokenConstants';
import {
  DEMO_EVENT,
  getStorageStates,
  PUSH_INVESTIBLES_CHANNEL,
  PUSH_MARKETS_CHANNEL, PUSH_PRESENCE_CHANNEL, PUSH_STAGE_CHANNEL,
  REMOVED_MARKETS_CHANNEL,
  sendMarketsStruct, SYNC_ERROR_EVENT,
  updateMarkets,
  VERSIONS_EVENT
} from '../../api/versionedFetchUtils';
import _ from 'lodash'

export const LOAD_MARKET_CHANNEL = 'LoadMarketChannel';
export const INVITE_MARKET_EVENT = 'InviteMarketEvent';
export const GUEST_MARKET_EVENT = 'GuestMarketEvent';
export const LOAD_TOKENS_CHANNEL = 'LoadTokensChannel';
export const LOAD_EVENT = 'LoadEvent';

let loadingMarketHack = [];

function beginListening(dispatch, setTokensHash) {
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
    const { payload: { event, marketDetails, signature} } = data;
    switch (event) {
      case DEMO_EVENT:
        console.info('Responding to demo market event');
      // eslint-disable-next-line no-fallthrough
      case VERSIONS_EVENT:
        addMarketsToStorage(dispatch, marketDetails);
        break;
      case SYNC_ERROR_EVENT:
        dispatch(addSyncError(signature));
        break;
      default:
        // console.debug(`Ignoring identity event ${event}`);
    }
  });
  registerListener(LOAD_MARKET_CHANNEL, 'marketsLoadStart', (data) => {
    const { payload: { event, marketToken, marketId } } = data;
    let loginPromise = undefined;
    switch (event) {
      case INVITE_MARKET_EVENT:
        if (!loadingMarketHack.includes(marketToken)) {
          loadingMarketHack.push(marketToken);
          loginPromise = getMarketFromInvite(marketToken);
        }
        break;
      case GUEST_MARKET_EVENT:
        if (!loadingMarketHack.includes(marketId)) {
          loadingMarketHack.push(marketId);
          // Login with market id to create subscribed capability if necessary
          loginPromise = getMarketFromUrl(marketId);
        }
        break;
      default:
      // console.debug(`Ignoring identity event ${event}`);
    }
    if (loginPromise) {
      loginPromise.then((result) => {
        console.log('Quick adding market after load');
        const { market, user, stages, uclusion_token: token, investible } = result;
        const { id, parent_comment_market_id: parentMarketId } = market;
        addMarketToStorage(dispatch, market);
        pushMessage(PUSH_PRESENCE_CHANNEL, { event: ADD_PRESENCE, marketId: id, presence: user });
        pushMessage(PUSH_STAGE_CHANNEL, { event: VERSIONS_EVENT, stageDetails: { [id]: stages } });
        if (investible) {
          pushMessage(PUSH_INVESTIBLES_CHANNEL, { event: LOAD_EVENT, investibles: [investible] });
        }
        const tokenStorageManager = new TokenStorageManager();
        return tokenStorageManager.storeToken(TOKEN_TYPE_MARKET, id, token).then(() => {
          // We know the market we just logged into is dirty so skip normal call to check it first
          const marketsStruct = {};
          return getStorageStates().then((storageStates) => {
            updateMarkets([id], marketsStruct, 1, storageStates, !_.isEmpty(parentMarketId))
              .then(() => sendMarketsStruct(marketsStruct));
          });
        });
      }).catch((error) => {
        console.error(error);
        toastError('errorMarketFetchFailed');
      });
    }
  });
}

export default beginListening;
