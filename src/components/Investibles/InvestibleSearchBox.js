import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import elasticlunr from 'elasticlunr';
import { TextField } from '@material-ui/core';

import { updateSearchResults } from '../../store/Search/actions';
import { getCurrentMarketId } from '../../store/Markets/reducer';
import { getInvestibles } from '../../store/MarketInvestibles/reducer';

function InvestibleSearchBox(props) {
  const { dispatch, currentMarketId, marketInvestibles } = props;
  const [index, setIndex] = useState({});
  const [oldMarketId, setOldMarketId] = useState('');

  useEffect(() => {
    if (oldMarketId !== currentMarketId) {
      const newIndex = elasticlunr(function () {
        this.addField('name');
        this.addField('description');
        this.setRef('id');
      });
      if (marketInvestibles) {
        marketInvestibles.forEach((investible) => {
          newIndex.addDoc(investible);
        });
      }
      setIndex(newIndex);
      setOldMarketId(currentMarketId);
    }
  });

  function doSearch(newQuery){
    const results = index.search(newQuery);
    dispatch(updateSearchResults(newQuery, results));
  }

  return (
    <TextField onChange={event => doSearch(event.target.value)}/>
  );
}

function mapStateToProps(state) {
  const currentInvestibles = getInvestibles(state.investiblesReducer);
  const currentMarket = getCurrentMarketId(state.marketsReducer);
  const marketInvestibles = currentInvestibles[currentMarket];

  return {
    currentMarket,
    marketInvestibles,
  };
}

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

export default connect(mapStateToProps, mapDispatchToProps)(InvestibleSearchBox);
