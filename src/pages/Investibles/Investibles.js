/* eslint-disable react/forbid-prop-types */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withTheme, withStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';
import _ from 'lodash';
import { getInvestibles } from '../../store/MarketInvestibles/reducer';
import Activity from '../../containers/Activity/Activity';
import { getMarketCategories, categoryPropType } from '../../store/Markets/reducer';
import { getCurrentUser } from '../../store/Users/reducer';
import InvestibleList from '../../components/Investibles/InvestibleList';
import { withMarketId } from '../../components/PathProps/MarketId';
import { fetchInvestibleList } from '../../store/MarketInvestibles/actions';
import LoginModal from '../Login/LoginModal';
import InvestibleSearchBox from '../../components/Investibles/InvestibleSearchBox';
import { getActiveInvestibleSearches } from '../../store/ActiveSearches/reducer';
import { fetchCommentList } from '../../store/Comments/actions';
import { getComments } from '../../store/Comments/reducer';
import { withUserAndPermissions } from '../../components/UserPermissions/UserPermissions';
import { fetchMarketCategories } from '../../store/Markets/actions';

const pollRate = 5400000; // 90 mins = 5400 seconds * 1000 for millis

const styles = theme => ({
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
});

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
    for (let x = 0; x < searchResults.length; x += 1) {
      selector[searchResults[x].ref] = true;
    }
    return marketInvestibles.filter(investible => (selector[investible.id]));
  }

  function getCurrentInvestibleList() {
    const marketInvestibles = getMarketInvestibles();
    const { activeInvestibleSearches, marketId } = props;
    const currentSearch = activeInvestibleSearches[marketId];
    if (currentSearch && currentSearch.results && currentSearch.query !=='') {
      return getFilteredSearchList(marketInvestibles, currentSearch.results);
    }
    return marketInvestibles;
  }

  function getItems() {
    const {
      investibles, marketId, dispatch, comments, userPermissions,
      history: { location: { pathname } },
    } = props;
    const showLogin = /(.+)\/login/.test(pathname.toLowerCase());
    const { canReadComments } = userPermissions;
    if (!showLogin) {
      if (lastFetchedMarketId !== marketId) {
        setLastFetchedMarketId(marketId);
      }
      console.debug('Fetching investibles with marketId:', marketId);
      // In case categories have changed
      dispatch(fetchMarketCategories({ marketId }));
      const currentInvestibleList = marketId in investibles ? investibles[marketId] : [];
      const currentCommentList = marketId in comments ? comments[marketId] : [];
      dispatch(fetchInvestibleList({ marketId, currentInvestibleList }));
      if (canReadComments) {
        dispatch(fetchCommentList({ marketId, currentCommentList }));
      }
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
    classes,
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
          <div className={classes.root}>
            <InvestibleSearchBox />
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
  comments: PropTypes.object,
  categories: PropTypes.arrayOf(categoryPropType),
  marketId: PropTypes.string,
  user: PropTypes.object,
  activeInvestibleSearches: PropTypes.object,
  history: PropTypes.object.isRequired,
  userPermissions: PropTypes.object.isRequired,
};

const mapStateToProps = state => ({
  investibles: getInvestibles(state.investiblesReducer),
  categories: getMarketCategories(state.marketsReducer),
  comments: getComments(state.commentsReducer),
  user: getCurrentUser(state.usersReducer),
  activeInvestibleSearches: getActiveInvestibleSearches(state.activeSearches),
});

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(injectIntl(withStyles(styles)(withTheme()(withUserAndPermissions(withMarketId(React.memo(InvestiblesPage)))))));
