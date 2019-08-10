import React, { useEffect, useState } from 'react';
import { MenuItem, InputLabel, FormControl, Select } from '@material-ui/core';
import { injectIntl } from 'react-intl';

function MarketSelect(props) {

  const [market, setMarket] = useState('');
  const { markets, intl } = props;

  function handleChange(event) {
    setMarket(event.target.value);
  }

  function getMenuItems() {
    if (!markets) {
      return [];
    }
    return markets.map(market => <MenuItem key={market.id} value={market.id}>market.name</MenuItem>);
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
          {getMenuItems()}
        </Select>
      </FormControl>
    </form>
  );

}

export default injectIntl(MarketSelect);


