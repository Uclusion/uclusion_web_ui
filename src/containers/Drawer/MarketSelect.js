import React, { useState } from 'react';
import { MenuItem, InputLabel, FormControl, Select } from '@material-ui/core';
import { injectIntl } from 'react-intl';
import { formMarketLink } from '../../utils/marketIdPathFunctions';
import { withRouter } from 'react-router';
import { getActiveMarkeList } from '../../api/sso';
import useMarketContext from '../../contexts/useMarketsContext';

function MarketSelect (props) {

  const [market, setMarket] = useState('');

  const { switchMarket, markets } = useMarketContext();
  const { intl, history } = props;

  function handleChange (event) {
    const market = event.target.value;
    setMarket(market);
    switchMarket(market.id);
    history.push(formMarketLink(market.id, ''));
  }

  function getMenuItems(markets) {
    if (!markets) {
      return [];
    }
    return markets.map(market => <MenuItem key={market.id} value={market}>{market.name}</MenuItem>);
  }

  return (
      <form autoComplete="off">
        <FormControl>
          <InputLabel html-for="market-select">{intl.formatMessage({ id: 'marketSelectDefault' })}</InputLabel>
          <Select
            value={market}
            onChange={handleChange}
            inputProps={{ id: 'market-select' }}
          >
            {getMenuItems(markets)}
          </Select>
        </FormControl>
      </form>
  );

}

export default injectIntl(withRouter(MarketSelect));


