import React from 'react';
import PropTypes from 'prop-types';
import MarketsListItem from './MarketsListItem';


function MarketsList(props) {

  const { markets } = props;

  function getMarketItems() {
    if (!markets) {
      return [];
    }
    return markets.map((market) => {
      return (<MarketsListItem key={market.id} market={market} />);
    });
  }

  return (
    <div>
      {getMarketItems()}
    </div>
  );
}

MarketsList.propTypes = {
  markets: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default MarketsList;

