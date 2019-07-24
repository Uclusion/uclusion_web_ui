import React from 'react';

import LockIcon from '@material-ui/icons/Lock';
import ListIcon from '@material-ui/icons/List';
import { formMarketLink } from '../utils/marketIdPathFunctions';


function getMarketsItems(markets) {
  const menuItems = markets.map(market => {
    const { id, name } = market;
    return {
      primaryText: name,
      value: formMarketLink(id, 'investibles'),
      leftIcon: <ListIcon />,
    };
  });
  return menuItems;
}

const menuItems = (props) => {
  const {
    intl,
    handleSignOut,
    markets,
  } = props;


  const universalItems = [
    {
      value: '/',
      onClick: handleSignOut,
      primaryText: intl.formatMessage({ id: 'sign_out' }),
      leftIcon: <LockIcon />,
    },
  ];
  const marketsItems = getMarketsItems(markets);
  return [...marketsItems, ...universalItems];
};

export default menuItems;
