import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { getMarket } from '../../contexts/MarketsContext/marketsContextHelper';
import { Link } from '@material-ui/core';
import CardType, { AGILE_PLAN_TYPE, DECISION_TYPE as DES_TYPE_ICON, VOTING_TYPE } from '../CardType';
import { formMarketLink } from '../../utils/marketIdPathFunctions';
import { DECISION_TYPE, INITIATIVE_TYPE, PLANNING_TYPE } from '../../constants/markets';

function getCardType (marketType) {
  switch (marketType) {
    case DECISION_TYPE:
      return DES_TYPE_ICON;
    case PLANNING_TYPE:
      return AGILE_PLAN_TYPE;
    case INITIATIVE_TYPE:
      return VOTING_TYPE;
    default:
      return null;
  }
}

function MarketSearchResult (props) {
  const { marketId } = props;
  const [marketsState] = useContext(MarketsContext);
  const market = getMarket(marketsState, marketId);
  const {
    market_type: type,
    name,
  } = market;
  const linkTarget = formMarketLink(marketId);

  return (
    <Link
      href={linkTarget}
    >
      <CardType
        label={name}
        type={getCardType(type)}
      />
    </Link>
  );

}

MarketSearchResult.propTypes = {
  marketId: PropTypes.string.isRequired,
};

export default MarketSearchResult;