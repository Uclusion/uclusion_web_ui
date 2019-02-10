/* eslint-disable react/forbid-prop-types */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withTheme } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';
import { getInvestibles, investiblePropType } from '../../store/MarketInvestibles/reducer';
import Activity from '../../containers/Activity/Activity';
import { getMarketCategories, categoryPropType } from '../../store/Markets/reducer';
import { getCurrentUser } from '../../store/Users/reducer';
import InvestibleList from '../../components/Investibles/InvestibleList';
import { withMarketId } from '../../components/PathProps/MarketId';
import { fetchInvestibleList } from '../../store/MarketInvestibles/actions';
import LoginModal from '../Login/LoginModal';

const pollRate = 5400000; // 90 mins = 5400 seconds * 1000 for millis

function InvestiblesPage(props) {
  const [lastFetched, setLastFetched] = useState(undefined);
  function getItems() {
    const {
      investibles, marketId, dispatch,
      history: { location: { pathname } },
    } = props;
    const showLogin = /(.+)\/login/.test(pathname.toLowerCase());
    if (!showLogin && investibles && investibles.length > 0
      && (!lastFetched || (Date.now() - lastFetched > pollRate))) {
      console.log(`Fetching investibles from polling with last fetched ${lastFetched}`);
      setLastFetched(Date.now());
      dispatch(fetchInvestibleList({ marketId, currentInvestibleList: investibles }));
    }
  }
  useEffect(() => {
    getItems(); // Initial fetch
    const timer = setInterval(() => getItems(), pollRate);
    return () => {
      clearInterval(timer);
    };
  });

  const {
    intl,
    investibles,
    categories,
    marketId,
    user,
    dispatch,
    history: { location: { pathname } },
  } = props;

  const showLogin = /(.+)\/login/.test(pathname.toLowerCase());

  if (!showLogin && investibles && investibles.length === 0
    && (!lastFetched || (Date.now() - lastFetched > pollRate))) {
    console.log('Fetching investibles');
    setLastFetched(Date.now());
    dispatch(fetchInvestibleList({ marketId, currentInvestibleList: investibles }));
  }
  // TODO: give choice of teamId instead of default
  return (

    <div>

      <Activity
        isLoading={investibles === undefined}
        containerStyle={{ overflow: 'hidden' }}
        title={intl.formatMessage({ id: 'investibles' })}
      >

        {investibles && user && user.market_presence
        && (
        <InvestibleList
          teamId={user.default_team_id}
          user={user}
          marketId={marketId}
          investibles={investibles}
          categories={categories}
        />
        )}
      </Activity>

      <LoginModal
        open={showLogin}
      />
    </div>

  );
}

InvestiblesPage.propTypes = {
  dispatch: PropTypes.func.isRequired,
  intl: PropTypes.object.isRequired,
  investibles: PropTypes.arrayOf(investiblePropType),
  categories: PropTypes.arrayOf(categoryPropType),
  marketId: PropTypes.string,
  user: PropTypes.object,
  history: PropTypes.object.isRequired,
};

const mapStateToProps = state => ({
  investibles: getInvestibles(state.investiblesReducer),
  categories: getMarketCategories(state.marketsReducer),
  user: getCurrentUser(state.usersReducer),
});

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(injectIntl(withTheme()(withMarketId(InvestiblesPage))));
