import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import elasticlunr from 'elasticlunr';
import { TextField } from '@material-ui/core';

import { updateSearchResults } from '../../store/Search/actions';
import { getCurrentMarketId } from '../../store/Markets/reducer';
import { getInvestibles } from '../../store/MarketInvestibles/reducer';

function InvestibleSearchBox(props) {
  const { dispatch, index } = props;
  const [query, setQuery] = useState(0);

  useEffect(() => {
    const result = index.search(query);
    dispatch(updateSearchResults(query, result));
  });

  return (
    <TextField onChange={event => setQuery(event.target.value)}/>
  );
}

function mapStateToProps(state) {
  const currentInvestibles = getInvestibles(state.investiblesReducer);
  const currentMarket = getCurrentMarketId(state.marketsReducer);
  const marketInvestibles = currentInvestibles[currentMarket];
  const index = elasticlunr(function () {
    this.addField('name');
    this.addField('description');
    this.setRef('id');
  });
  if (marketInvestibles) {
    marketInvestibles.forEach((investible) => {
      index.addDoc(investible);
    });
  }
  return {
    index,
  };
}

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

export default connect(mapStateToProps, mapDispatchToProps)(InvestibleSearchBox);
