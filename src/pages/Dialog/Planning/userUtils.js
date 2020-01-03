import { getMarketInfo } from '../../../utils/userFunctions';
import _ from 'lodash';

// the names of stages that entities end up in, where no
// forward state progress is possible
const TERMINAL_STAGE_NAMES = ['Verified', 'Not Doing'];

/**
 * Returns the investibles in the market assigned to the user
 * @param userId
 * @param marketId
 * @param investibles
 * @returns {*}
 */
export function getUserInvestibles(userId, marketId, investibles) {
  const myInvestibles = investibles.filter((investible) => {
    const marketInfo = getMarketInfo(investible, marketId);
    const { assigned } = marketInfo;
    const assignedFull = Array.isArray(assigned) ? assigned : [];
    return assignedFull.includes(userId);
  });
  return myInvestibles;
}

/**
 * Returns whether or not the user is eligible to become an observer
 * @param userId the user id we want the answer for
 * @param marketId the id of the market we want to become observer in
 * @param investibles the list of investibles in the market
 * */
export function getUserEligibleForObserver(userId, marketId, investibles) {
  /* Note, ideally stage names would be Ids instead of names, but getting the ids would require
  * a name search anyways, at least until the backend has a concept of terminal
  */
  const userInvestibles = getUserInvestibles(userId, marketId, investibles);
  if (_.isEmpty(userInvestibles)) {
    return true;
  }
  for (let i = 1; i < userInvestibles.length; i += 1) {
    const investible = userInvestibles[i];
    const marketInfo = getMarketInfo(investible, marketId);
    const { stage } = marketInfo;
    if (!TERMINAL_STAGE_NAMES.includes(stage)) {
      return false;
    }
  }
  return true;
}
