import React from 'react';
import PropTypes from 'prop-types';
import { List, Divider, Menu, MenuList } from '@material-ui/core';
import SidebarMarketsListItem from './SidebarMarketsListItem';
function SidebarMarketsList(props) {

  const { markets } = props;

  function getMarketItems() {
    if (!markets) {
      return [];
    }
    const items = [];
    for (let x = 0; x < markets.length; x += 1) {
      const market = markets[x];
      const listItem = <SidebarMarketsListItem key={market.id} market={market} />;
      items.push(listItem);
    }
    return items;
  }

  return (
    <MenuList dense disablePadding>
      {getMarketItems()}
    </MenuList>
  );
}

SidebarMarketsList.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  markets: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default SidebarMarketsList;

