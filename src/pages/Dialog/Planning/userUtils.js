import { getMarketInfo } from '../../../utils/userFunctions';
import _ from 'lodash'

/**
 * Returns the investibles in the market assigned to the user
 * @param userId
 * @param marketId
 * @param investibles
 * @param visibleStages stages to filter investibles to
 * @returns {*}
 */
export function getUserInvestibles(userId, marketId, investibles, visibleStages=[]) {
  return investibles.filter((investible) => {
    const marketInfo = getMarketInfo(investible, marketId);
    const { assigned, stage } = marketInfo;
    const assignedFull = Array.isArray(assigned) ? assigned : [];
    return assignedFull.includes(userId) && visibleStages.includes(stage);
  });
}

/**
 * Find list of investibles to display in swimlane for that user
 * @param userInvestibles
 * @param limitInvestibles
 * @param limitInvestiblesAge
 * @param marketId
 * @param stageId
 * @returns constrained user investibles
 */
export function getUserSwimlaneInvestibles(userInvestibles, limitInvestibles, limitInvestiblesAge, marketId, stageId) {
  let stageInvestibles = userInvestibles.filter((investible) => {
    const { market_infos: marketInfos } = investible;
    const marketInfo = marketInfos.find(info => info.market_id === marketId);
    if (process.env.NODE_ENV !== 'production') {
      if (marketInfo === undefined) {
        console.warn(`no marketinfo for ${marketId} with `, marketInfos);
      }
    }
    return marketInfo !== undefined && marketInfo.stage === stageId;
  });
  if (limitInvestibles && stageInvestibles) {
    const sortedInvestibles = stageInvestibles.sort(function(a, b) {
      const aMarketInfo = getMarketInfo(a, marketId);
      const bMarketInfo = getMarketInfo(b, marketId);
      return new Date(bMarketInfo.updated_at) - new Date(aMarketInfo.updated_at);
    });
    stageInvestibles = _.slice(sortedInvestibles, 0, limitInvestibles);
  }
  if (limitInvestiblesAge > 0 && stageInvestibles) {
    return stageInvestibles.filter((investible) => {
      const { market_infos: aMarketInfos } = investible;
      const aMarketInfo = aMarketInfos.find(info => info.market_id === marketId);
      return Date.now() - new Date(aMarketInfo.updated_at).getTime() < limitInvestiblesAge*24*60*60*1000;
    });
  }
  return stageInvestibles;
}

export function inVerifedSwimLane(inv, investibles, verifiedStage, marketId) {
  const verifiedStageSafe = verifiedStage || {};
  const verifiedStageId = verifiedStageSafe.id;
  const aMarketInfo = getMarketInfo(inv, marketId);
  const { assigned, stage: currentStageId } = (aMarketInfo || {});
  if (currentStageId !== verifiedStageId) {
    return false;
  }
  if (_.isEmpty(assigned)) {
    return false;
  }
  return assigned.some((userId) => {
    const userInvestibles = getUserInvestibles(userId, marketId, investibles, [verifiedStageId]);
    const inVerified = getUserSwimlaneInvestibles(userInvestibles, verifiedStageSafe.allowed_investibles,
      verifiedStageSafe.days_visible, marketId, verifiedStageId);
    return (inVerified || []).some((investible) => investible.investible.id === inv.investible.id);
  });
}
