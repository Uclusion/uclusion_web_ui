import React from 'react';
import PropTypes from 'prop-types';
import { List, Divider } from '@material-ui/core';
import MarketsListItem from './MarketsListItem';
function MarketsList(props) {

  const { markets } = props;

  function getMarketItems() {
    if (!markets) {
      return [];
    }
    const items = [];
    for (let x = 0; x < markets.length; x += 1) {
      const market = markets[x];
      const listItem = <MarketsListItem key={market.id} market={market} />;
      items.push(listItem);
      if (x !== (markets.length - 1)) {
        items.push(<Divider component="li" />);
      }
    }
    return items;
  }

  return (
    <List>
      {getMarketItems()}
    </List>
  );
}

MarketsList.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  markets: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default MarketsList;

