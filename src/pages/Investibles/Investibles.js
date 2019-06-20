/* eslint-disable react/forbid-prop-types */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withTheme, withStyles } from '@material-ui/core/styles';
import { Button } from '@material-ui/core';
import { injectIntl } from 'react-intl';
import { getInvestibles } from '../../store/MarketInvestibles/reducer';
import Activity from '../../containers/Activity/Activity';
import { getCurrentUser } from '../../store/Users/reducer';
import InvestibleList from '../../components/Investibles/InvestibleList';
import InvestibleDetail from '../../components/Investibles/InvestibleDetail';
import { withMarketId } from '../../components/PathProps/MarketId';
import LoginModal from '../Login/LoginModal';
import InvestibleSearchBox from '../../components/Investibles/InvestibleSearchBox';
import { getActiveInvestibleSearches, getSelectedStage } from '../../store/ActiveSearches/reducer';
import { getComments } from '../../store/Comments/reducer';
import { withUserAndPermissions } from '../../components/UserPermissions/UserPermissions';
import { getMarketPresenceName } from '../../utils/marketSelectionFunctions';
import MarketFollowUnfollow from '../../components/AppBarIcons/MarketFollowUnfollow';
import MarketStageList from '../../components/Markets/MarketStageList';
import MarketStageFollowUnfollow from '../../components/Markets/MarketStageFollowUnfollow';
import { fetchMarketInvestibleInfo } from '../../utils/postAuthFunctions';
import HelpMovie from '../../components/ModalMovie/HelpMovie';
import { amAlreadyLoggedIn } from '../../utils/ReactWebAuthorizer';

const pollRate = 5400000; // 90 mins = 5400 seconds * 1000 for millis

const styles = theme => ({
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  toolbar: {
    width: '100%',
    display: 'flex',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  toolbarButton: {
    margin: theme.spacing.unit,
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  stageSelector: {
    display: 'flex',
    alignItems: 'center',
    margin: theme.spacing.unit,
    marginTop: theme.spacing.unit * 2,
    width: 384,
    [theme.breakpoints.only('xs')]: {
      width: '100%',
    },
  },
});

function InvestiblesPage(props) {
  const [lastFetchedMarketId, setLastFetchedMarketId] = useState(undefined);
  const [showFavorite, setShowFavorite] = useState(false);

  const {
    marketId,
    intl,
    allCategories,
    user,
    history,
    classes,
    investibles,
    location,
    userPermissions,
  } = props;
  const { location: { hash, pathname } } = history;
  const { isGuest, isMarketAdmin, canInvest } = userPermissions;

  function getMarketInvestibles() {
    const { investibles, allCategories } = props;
    if (marketId in investibles) {
      return investibles[marketId];
    }
    if (marketId in allCategories || investibles) {
      return [];
    }
    return undefined;
  }

  function getFilteredSearchList(marketInvestibles, searchResults) {
    const selector = {};
    for (let x = 0; x < searchResults.length; x += 1) {
      selector[searchResults[x].ref] = true;
    }
    return marketInvestibles.filter(investible => (selector[investible.id]));
  }

  function getSearchFilteredInvestibles() {
    const marketInvestibles = getMarketInvestibles();
    const { activeInvestibleSearches } = props;
    const currentSearch = activeInvestibleSearches[marketId];
    if (marketInvestibles && marketInvestibles.length > 0 && currentSearch
      && currentSearch.results && currentSearch.query !== '') {
      // now render the filtered list
      return getFilteredSearchList(marketInvestibles, currentSearch.results);
    }
    return marketInvestibles;
  }

  function getCurrentInvestibleList() {
    const searched = getSearchFilteredInvestibles();
    const { selectedStage } = props;
    if (selectedStage && selectedStage[marketId]) {
      const stage = selectedStage[marketId];
      if (stage.includes('_')) {
        const values = stage.split('_');
        return searched.filter(element => element.stage !== values[1]);
      }
      return searched.filter(element => element.stage === stage);
    }
    return searched;
  }

  function getItems() {
    const {
      userPermissions,
      history: { location: { pathname } },
    } = props;
    const showLogin = /(.+)\/login/.test(pathname.toLowerCase());
    const { canReadComments } = userPermissions;
    if (!showLogin && canReadComments !== undefined) {
      if (lastFetchedMarketId !== marketId) {
        setLastFetchedMarketId(marketId);
      }
      fetchMarketInvestibleInfo({ fetchComments: canReadComments, ...props });
    }
  }

  function toggleShowFavorite() {
    setShowFavorite(!showFavorite);
  }

  function shouldIShowLogin() {
    const shouldLogin = /(.+)\/login/.test(pathname.toLowerCase()) && !amAlreadyLoggedIn();
    return shouldLogin;
  }

  useEffect(() => {
    if (lastFetchedMarketId !== marketId) {
      // useEffect may happen many  times but initial fetch only when market changes
      getItems();
    }
    const timer = setInterval(() => getItems(), pollRate);
    return () => {
      clearInterval(timer);
    };
  });


  const showLogin = shouldIShowLogin();
  let currentInvestibleList = getCurrentInvestibleList();
  if (showFavorite) {
    currentInvestibleList = currentInvestibleList.filter(({ current_user_is_following }) => current_user_is_following);
  }

  const categories = allCategories[marketId];

  let investibleDetail = null;
  if (hash) {
    const hashPart = hash.substr(1).split(':');
    if (hashPart.length >= 2) {
      const hashKey = hashPart[0];
      const hashValue = hashPart[1];
      if (hashKey === 'investible') {
        const allInvestibles = investibles[marketId] || [];
        for (const investible of allInvestibles) { //eslint-disable-line
          if (investible.id === hashValue) {
            investibleDetail = investible;
            break;
          }
        }
      }
    }
  }
  const currentMarketName = getMarketPresenceName(user, marketId);

  // TODO: give choice of teamId instead of default
  return (

    <div>

      <Activity
        isLoading={currentInvestibleList === undefined || user === undefined}
        containerStyle={{ overflow: 'hidden' }}
        title={intl.formatMessage({ id: 'marketInvestiblesTitle' }, { marketName: currentMarketName })}
        titleButtons={!isGuest && (<MarketFollowUnfollow user={user} marketId={marketId} />)}
      >
        {currentInvestibleList && user && user.market_presence
        && (
          <div className={classes.root}>
            {!showLogin && isMarketAdmin && <HelpMovie name="adminInvestiblesIntro" /> }
            {!showLogin && canInvest && <HelpMovie name="usersInvestiblesIntro" /> }
            <div className={classes.toolbar}>
              <InvestibleSearchBox />
              <div className={classes.stageSelector}>
                <MarketStageList marketId={marketId} />
                {!isGuest && (<MarketStageFollowUnfollow marketId={marketId} />)}
              </div>
              <Button
                className={classes.toolbarButton}
                variant="contained"
                color="primary"
                onClick={toggleShowFavorite}
              >
                {intl.formatMessage({ id: showFavorite ? 'showAll' : 'showFavorite' })}
              </Button>
            </div>
            <div className={classes.content}>
              <InvestibleList
                location={location}
                teamId={user.default_team_id}
                user={user}
                marketId={marketId}
                investibles={currentInvestibleList}
                categories={categories}
              />
              {investibleDetail && (
                <InvestibleDetail
                  investible={investibleDetail}
                  onClose={() => history.push(pathname)}
                />
              )}
            </div>
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
  allCategories: PropTypes.object,
  marketId: PropTypes.string,
  user: PropTypes.object,
  activeInvestibleSearches: PropTypes.object,
  selectedStage: PropTypes.object,
  history: PropTypes.object.isRequired,
  userPermissions: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
};

const mapStateToProps = state => ({
  investibles: getInvestibles(state.investiblesReducer),
  allCategories: state.marketsReducer.marketCategories,
  comments: getComments(state.commentsReducer),
  user: getCurrentUser(state.usersReducer),
  activeInvestibleSearches: getActiveInvestibleSearches(state.activeSearches),
  selectedStage: getSelectedStage(state.activeSearches),
});

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(injectIntl(withStyles(styles)(withTheme()(withUserAndPermissions(withMarketId(React.memo(InvestiblesPage)))))));
