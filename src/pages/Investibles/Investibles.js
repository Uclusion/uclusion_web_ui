/* eslint-disable react/forbid-prop-types */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withTheme } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';
import { getInvestibles } from '../../store/MarketInvestibles/reducer';
import Activity from '../../containers/Activity/Activity';
import { getMarketCategories, categoryPropType } from '../../store/Markets/reducer';
import { getCurrentUser } from '../../store/Users/reducer';
import InvestibleList from '../../components/Investibles/InvestibleList';
import { withMarketId } from '../../components/PathProps/MarketId';
import { fetchInvestibleList } from '../../store/MarketInvestibles/actions';
import LoginModal from '../Login/LoginModal';
import InvestibleSearchBox from '../../components/Investibles/InvestibleSearchBox';
import { hasInvestibleSearchActive, getActiveInvestibleSearchResults } from '../../store/Search/reducer';
import _ from 'lodash';

const pollRate = 5400000; // 90 mins = 5400 seconds * 1000 for millis

function InvestiblesPage(props) {
  const [lastFetchedMarketId, setLastFetchedMarketId] = useState(undefined);

  function getMarketInvestibles(){
    const { marketId, investibles, categories } = props;
    if (marketId in investibles) {
      return investibles[marketId];
    }
    if (categories || investibles) {
      return [];
    }
    return undefined;
  }

  function getFilteredSearchList(marketInvestibles, searchResults){
    const selector = {};
    for(var x = 0; x < searchResults.length; x++){
      selector[searchResults[x].ref] = true;
    }
    return _.filter(marketInvestibles, (investible) => (selector[investible.id]));
  }

  function getCurrentInvestibleList(){
    const marketInvestibles = getMarketInvestibles();
    const {investibleSearchActive, investibleSearchResults } = props;
    if (investibleSearchActive && investibleSearchResults){
      return getFilteredSearchList(marketInvestibles, investibleSearchResults);
    }
    return marketInvestibles;
  }

  function getItems() {
    const {
      investibles, marketId, dispatch,
      history: { location: { pathname } },
    } = props;
    const showLogin = /(.+)\/login/.test(pathname.toLowerCase());
    if (!showLogin) {
      if (lastFetchedMarketId !== marketId) {
        setLastFetchedMarketId(marketId);
      }
      console.log(`Fetching investibles with marketId ${marketId}`);
      const currentInvestibleList = marketId in investibles ? investibles[marketId] : [];
      dispatch(fetchInvestibleList({ marketId, currentInvestibleList }));
    }
  }
  useEffect(() => {
    const { marketId } = props;
    if (lastFetchedMarketId !== marketId) {
      // useEffect may happen many  times but initial fetch only when market changes
      getItems();
    }
    const timer = setInterval(() => getItems(), pollRate);
    return () => {
      clearInterval(timer);
    };
  });

  const {
    intl,
    categories,
    marketId,
    user,
    history: { location: { pathname } },
  } = props;

  const showLogin = /(.+)\/login/.test(pathname.toLowerCase());
  const currentInvestibleList = getCurrentInvestibleList();

  // TODO: give choice of teamId instead of default
  return (

    <div>

      <Activity
        isLoading={currentInvestibleList === undefined}
        containerStyle={{ overflow: 'hidden' }}
        title={intl.formatMessage({ id: 'investibles' })}
      >

        {currentInvestibleList && user && user.market_presence
        && (
          <div>
        <InvestibleSearchBox/>
        <InvestibleList
          teamId={user.default_team_id}
          user={user}
          marketId={marketId}
          investibles={currentInvestibleList}
          categories={categories}
        />
          </div>
        )}
      </Activity>

      {showLogin && (
        <LoginModal
          open={showLogin}
        />
      )}
    </div>

  );
}

InvestiblesPage.propTypes = {
  dispatch: PropTypes.func.isRequired,
  intl: PropTypes.object.isRequired,
  investibles: PropTypes.object,
  categories: PropTypes.arrayOf(categoryPropType),
  marketId: PropTypes.string,
  user: PropTypes.object,
  history: PropTypes.object.isRequired,
};

const mapStateToProps = state => ({
  investibles: getInvestibles(state.investiblesReducer),
  categories: getMarketCategories(state.marketsReducer),
  user: getCurrentUser(state.usersReducer),
  investibleSearchActive: hasInvestibleSearchActive(state.searchReducer),
  investibleSearchResults: getActiveInvestibleSearchResults(state.searchReducer),
});

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(injectIntl(withTheme()(withMarketId(React.memo(InvestiblesPage)))));
