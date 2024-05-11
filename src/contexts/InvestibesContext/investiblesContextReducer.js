import LocalForageHelper from '../../utils/LocalForageHelper'
import {
  INVESTIBLES_CHANNEL,
  INVESTIBLES_CONTEXT_NAMESPACE
} from './InvestiblesContext'
import { BroadcastChannel } from 'broadcast-channel'
import { broadcastId } from '../../components/ContextHacks/BroadcastIdProvider'
import _ from 'lodash'
import { removeInitializing } from '../../components/localStorageUtils'
import { addByIdAndVersion } from '../ContextUtils'
import { syncMarketList } from '../../components/ContextHacks/ForceMarketSyncProvider';

const INITIALIZE_STATE = 'INITIALIZE_STATE';
const UPDATE_INVESTIBLES = 'UPDATE_INVESTIBLES';
const UPDATE_FROM_VERSIONS = 'UPDATE_FROM_VERSIONS';

/** Possible messages to reducer * */

export function initializeState(newState) {
  return {
    type: INITIALIZE_STATE,
    newState,
  };
}

export function updateStorableInvestibles(investibles) {
  return {
    type: UPDATE_INVESTIBLES,
    investibles,
  };
}

export function versionsUpdateInvestibles(investibles) {
  return {
    type: UPDATE_FROM_VERSIONS,
    investibles,
  };
}


/** Reducer functions */

// expects that the investibles are already in a storable state
function doUpdateInvestibles(state, action, isQuickAdd) {
  const { investibles } = action;
  if (isQuickAdd) {
    investibles.forEach((investible) => {
      const { market_infos: marketInfos } = investible;
      marketInfos.forEach((marketInfo) => {
        syncMarketList.push(marketInfo.market_id);
      })
    });
  }
  const oldInvestibles = Object.values(removeInitializing(state))
  const newInvestibles = addByIdAndVersion(investibles, oldInvestibles, (item) => item.investible.id,
    (item1, item2) => {
      const { investible: investible1, market_infos: marketInfos1 } = item1
      const { investible: investible2, market_infos: marketInfos2 } = item2
      if (investible1.version < investible2.version) return false
      let collision = false
      marketInfos1.forEach((marketInfo1) => {
        const matched = marketInfos2.find((marketInfo2) => marketInfos1.market_id = marketInfo2.market_id)
        if (matched && marketInfo1.version < matched.version) {
          collision = true
        }
      })
      return !collision
    })
  const investibleHash = _.keyBy(newInvestibles, (item) => item.investible.id)
  return { ...removeInitializing(state), ...investibleHash }
}

function computeNewState(state, action) {
  switch (action.type) {
    case UPDATE_INVESTIBLES:
      return doUpdateInvestibles(state, action, true);
    case UPDATE_FROM_VERSIONS:
      return doUpdateInvestibles(state, action);
    case INITIALIZE_STATE:
      return action.newState;
    default:
      return state;
  }
}

let investiblesStoragePromiseChain = Promise.resolve(true);

function reducer(state, action) {
  const newState = computeNewState(state, action);
  if (action.type !== INITIALIZE_STATE) {
    // Initialize state comes from the disk so do not write it back and risk wiping out another tab
    const lfh = new LocalForageHelper(INVESTIBLES_CONTEXT_NAMESPACE);
    investiblesStoragePromiseChain = investiblesStoragePromiseChain.then(() => {
        lfh.setState(newState).then(() => {
          const myChannel = new BroadcastChannel(INVESTIBLES_CHANNEL);
          return myChannel.postMessage(broadcastId || 'investibles').then(() => myChannel.close())
            .then(() => console.info('Update investibles context sent.'));
        });
    });
  }
  return newState;
}

export default reducer;
