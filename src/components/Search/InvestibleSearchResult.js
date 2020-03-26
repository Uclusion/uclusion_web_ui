import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { getMarket } from '../../contexts/MarketsContext/marketsContextHelper';
import { DECISION_TYPE, INITIATIVE_TYPE, PLANNING_TYPE } from '../../constants/markets';
import CardType, { STORY_TYPE, VOTING_TYPE } from '../CardType';
import { Link } from '@material-ui/core';
import { formInvestibleLink } from '../../utils/marketIdPathFunctions';
import { getInvestible } from '../../contexts/InvestibesContext/investiblesContextHelper';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';

function getCardType(marketType) {
  switch (marketType){
    case PLANNING_TYPE:
      return STORY_TYPE;
    case INITIATIVE_TYPE:
      return VOTING_TYPE;
      //default to decision because it prevents a name conflict with card type and market type as import
    default:
      return DECISION_TYPE;
  }
}

function InvestibleSearchResult (props) {
  const { investibleId } = props;
  const [marketsState] = useContext(MarketsContext);
  const [investibleState] = useContext(InvestiblesContext);
  const inv = getInvestible(investibleState, investibleId);
  // we're going to assume the first info is what we want
  const { investible: { name }, market_infos: [firstInfo,] } = inv;
  const { market_id: marketId } = firstInfo;
  const market = getMarket(marketsState, marketId);
  // investibles for type initiative, are really markets, so treat it as such
  const { market_type: marketType } = market;
  const cardType = getCardType(marketType);
  const linkTarget = formInvestibleLink(marketId, investibleId);
  return (
    <Link
      href={linkTarget}
    >
      <CardType
        type={cardType}
        label={name}
      />
    </Link>
  );

}

InvestibleSearchResult.propTypes = {
  investibleId: PropTypes.string.isRequired,
};

export default InvestibleSearchResult;