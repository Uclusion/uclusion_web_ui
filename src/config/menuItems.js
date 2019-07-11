import React from 'react';

import QuestionAnswerIcon from '@material-ui/icons/QuestionAnswer';
import LockIcon from '@material-ui/icons/Lock';
import ListIcon from '@material-ui/icons/List';
import { formMarketLink } from '../utils/marketIdPathFunctions';
import { listUserMarkets } from '../utils/marketFunctions';




function getMarketsItems(user) {
  const markets = listUserMarkets(user);
  const menuItems = markets.map(market => {
    const { market_id, market_name } = market;
    return {
      primaryText: market_name,
      value: formMarketLink(market_id, 'investibles'),
      leftIcon: <ListIcon />,
    };
  });
  return menuItems;
}

const menuItems = (props) => {
  const {
    intl,
    handleSignOut,
    user,
  } = props;


  const universalItems = [
    {
      value: '/',
      onClick: handleSignOut,
      primaryText: intl.formatMessage({ id: 'sign_out' }),
      leftIcon: <LockIcon />,
    },
  ];
  const marketsItems = getMarketsItems(user);
  return [...marketsItems, ...universalItems];
};

export default menuItems;
