import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import elasticlunr from 'elasticlunr';
import { TextField } from '@material-ui/core';

import { updateSearchResults } from '../../store/Search/actions';
import { getCurrentMarketId } from '../../store/Markets/reducer';
import { getActiveInvestibleSearchQuery } from '../../store/Search/reducer';
import { getInvestibles } from '../../store/MarketInvestibles/reducer';

function InvestibleSearchBox(props) {
  const { dispatch, currentMarketId, marketInvestibles, query } = props;
  const [index, setIndex] = useState({});
  const [oldMarketId, setOldMarketId] = useState('');

  function removeHtml(html){
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  }

  useEffect(() => {
    if (oldMarketId !== currentMarketId) {
      const newIndex = elasticlunr(function () {
        this.addField('name');
        this.addField('description');
        this.setRef('id');
        this.saveDocument(false);
      });
      if (marketInvestibles) {
        marketInvestibles.forEach((investible) => {
          const doc = { ...investible };
          doc.description = removeHtml(doc.description);
          newIndex.addDoc(doc);
        });
      }
      setIndex(newIndex);
      setOldMarketId(currentMarketId);
    }
  });

  function doSearch(newQuery){
    const results = index.search(newQuery, { expand: true });
    dispatch(updateSearchResults(newQuery, results));
  }

  return (
    <TextField value={query} onChange={event => doSearch(event.target.value)}/>
  );
}

function mapStateToProps(state) {
  const currentInvestibles = getInvestibles(state.investiblesReducer);
  const currentMarket = getCurrentMarketId(state.marketsReducer);
  const marketInvestibles = currentInvestibles[currentMarket];
  const query = getActiveInvestibleSearchQuery(state.searchReducer);
  return {
    currentMarket,
    marketInvestibles,
    query,
  };
}

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

export default connect(mapStateToProps, mapDispatchToProps)(InvestibleSearchBox);
