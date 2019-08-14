import React, { useState } from 'react';
import { MenuItem, InputLabel, FormControl, Select } from '@material-ui/core';
import { injectIntl } from 'react-intl';
import { formMarketLink } from '../../utils/marketIdPathFunctions';
import { withRouter } from 'react-router';
import { getActiveMarkeList } from '../../api/sso';
import useMarketContext from '../../contexts/useMarketsContext';
import { withMarketId } from '../../components/PathProps/MarketId';

function MarketSelect (props) {

  const { intl, history, marketId } = props;

  const [market, setMarket] = useState(marketId);

  const { switchMarket, markets } = useMarketContext();

  function handleChange (event) {
    const marketId = event.target.value;
    setMarket(marketId);
    switchMarket(marketId);
    history.push(formMarketLink(marketId, ''));
  }

  function getMenuItems(markets) {
    if (!markets) {
      return [];
    }
    return markets.map(market => <MenuItem key={market.id} value={market.id}>{market.name}</MenuItem>);
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

export default injectIntl(withRouter(withMarketId(MarketSelect)));


