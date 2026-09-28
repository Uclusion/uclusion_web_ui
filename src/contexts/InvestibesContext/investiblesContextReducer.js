import LocalForageHelper from '../../utils/LocalForageHelper'
import {
  INVESTIBLES_CONTEXT_NAMESPACE
} from './InvestiblesContext'
import _ from 'lodash'
import { removeInitializing } from '../../components/localStorageUtils'
import { addByIdAndVersion } from '../ContextUtils'
import { leaderContextHack } from '../LeaderContext/LeaderContext';
import { queuePersistenceWrite } from '../../api/crossTabFreshness';

const INITIALIZE_STATE = 'INITIALIZE_STATE';
const UPDATE_INVESTIBLES = 'UPDATE_INVESTIBLES';
const UPDATE_FROM_VERSIONS = 'UPDATE_FROM_VERSIONS';
const REVERT_STAGE_GUESS = 'REVERT_STAGE_GUESS';

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

// J-all-487: put a job's stage guess back when no copy of the job came from the server by its deadline
export function revertStageGuess(investibleId, marketInfoId, deadline) {
  return {
    type: REVERT_STAGE_GUESS,
    investibleId,
    marketInfoId,
    deadline,
  };
}

/**
 * J-all-487: a stage guess still waiting on the server when the page closed is checked once the
 * investibles load from storage, at once if its deadline has passed.
 */
export function revertPendingStageGuesses(state, dispatch) {
  Object.values(state || {}).forEach((inv) => {
    (inv?.market_infos || []).forEach((marketInfo) => {
      const { stage_guess: stageGuess } = marketInfo;
      if (stageGuess) {
        setTimeout(() => dispatch(revertStageGuess(inv.investible.id, marketInfo.id, stageGuess.deadline)),
          Math.max(0, stageGuess.deadline - Date.now()));
      }
    });
  });
}


/** Reducer functions */

// expects that the investibles are already in a storable state
function doUpdateInvestibles(state, action) {
  const { investibles } = action;
  const oldInvestibles = Object.values(removeInitializing(state))
  const newInvestibles = addByIdAndVersion(investibles, oldInvestibles, (item) => item.investible.id,
    (item1, item2) => {
      const { investible: investible1, market_infos: marketInfos1 } = item1
      const { investible: investible2, market_infos: marketInfos2 } = item2
      if (investible1.version < investible2.version) return false
      let collision = false
      marketInfos1.forEach((marketInfo1) => {
        const matched = marketInfos2.find((aMarketInfo2) => marketInfo1.market_id === aMarketInfo2.market_id)
        if (matched && marketInfo1.version < matched.version) {
          collision = true
        }
      })
      return !collision
    })
  const investibleHash = _.keyBy(newInvestibles, (item) => item.investible.id)
  return { ...removeInitializing(state), ...investibleHash }
}

// A copy of the job from the server replaces the guessed market info and its stage_guess with it, so
// only a guess still carrying this deadline was never answered. The copy put back keeps the version
// from before the guess, so the version check still refuses it against anything newer.
function doRevertStageGuess(state, action) {
  const { investibleId, marketInfoId, deadline } = action;
  const inv = state[investibleId];
  const marketInfo = inv?.market_infos?.find((aMarketInfo) => aMarketInfo.id === marketInfoId);
  if (marketInfo?.stage_guess?.deadline !== deadline) {
    return state;
  }
  const revertedInvestible = {
    ...inv,
    market_infos: _.unionBy([marketInfo.stage_guess.before], inv.market_infos, 'id')
  };
  return doUpdateInvestibles(state, { investibles: [revertedInvestible] });
}

function computeNewState(state, action) {
  switch (action.type) {
    case UPDATE_INVESTIBLES:
      return doUpdateInvestibles(state, action, true);
    case UPDATE_FROM_VERSIONS:
      return doUpdateInvestibles(state, action);
    case REVERT_STAGE_GUESS:
      return doRevertStageGuess(state, action);
    case INITIALIZE_STATE:
      return action.newState;
    default:
      return state;
  }
}

function reducer(state, action) {
  const newState = computeNewState(state, action);
  if (action.type !== INITIALIZE_STATE && newState !== state) {
    const { isLeader } = leaderContextHack;
    if (isLeader) {
      // Initialize state comes from the disk so do not write it back and risk wiping out another tab
      const lfh = new LocalForageHelper(INVESTIBLES_CONTEXT_NAMESPACE);
      queuePersistenceWrite('investibles', () => {
        return lfh.setState(newState).then(() => {
          console.info('Updated investibles context storage.');
        });
      });
    }
  }
  return newState;
}

export default reducer;
