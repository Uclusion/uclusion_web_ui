/*
 Given the marketPresences and an investible id
 returns a transformed map of voters for the investible
 */
import { useContext } from 'react';
import { InvestiblesContext } from '../contexts/InvestibesContext/InvestiblesContext';
import { getInvestible } from '../contexts/InvestibesContext/investiblesContextHelper';
import { getMarketInfo } from './userFunctions';
import { MarketsContext } from '../contexts/MarketsContext/MarketsContext';
import { getMarket } from '../contexts/MarketsContext/marketsContextHelper';

export function useInvestibleVoters(marketPresences, investibleId, marketId) {
  const [investiblesState] = useContext(InvestiblesContext);
  const [marketsState] = useContext(MarketsContext);
  return calculateInvestibleVoters(investibleId, marketId, marketsState, investiblesState,
    marketPresences);
}

export function useAddressed(groupPresences, marketPresences, investibleId, marketId) {
  const [investiblesState] = useContext(InvestiblesContext);
  const [marketsState] = useContext(MarketsContext);
  const investedOrAddressed = calculateInvestibleVoters(investibleId, marketId, marketsState, investiblesState,
    marketPresences, true, true);
  const groupPresencesIds = groupPresences.map((presence) => presence.id);
  return investedOrAddressed.filter((investor) => !groupPresencesIds.includes(investor.id));
}

export function calculateInvestibleVoters(investibleId, marketId, marketsState, investiblesState,
  marketPresences, includeExpired, includeAddressed=false) {
  const market = getMarket(marketsState, marketId) || {};
  const { investment_expiration: investmentExpiration } = market;
  const inv = getInvestible(investiblesState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const lastStageChangeDate = new Date(marketInfo.last_stage_change_date);
  const acc = [];
  marketPresences.forEach(presence => {
    const { name, id, email, investments } = presence;
    (investments || []).forEach(investment => {
      const {
        quantity,
        investible_id: invId,
        comment_id: commentId,
        updated_at: updatedAt,
        deleted
      } = investment;
      const updatedAtDate = new Date(updatedAt);
      const lastEventTime = Math.max(lastStageChangeDate.getTime(), updatedAtDate.getTime());
      const isExpired = Date.now() - lastEventTime > investmentExpiration*86400000;
      // Check quantity exists or else is just addressed
      if (investibleId === invId && (includeExpired || (!deleted && !isExpired)) && (includeAddressed || quantity)) {
        acc.push({ name, id, email, quantity, commentId, updatedAt, deleted, isExpired });
      }
    });
  });
  return acc;
}