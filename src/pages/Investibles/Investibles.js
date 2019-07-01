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
import InvestibleSearchBox from '../../components/Investibles/InvestibleSearchBox';
import { getActiveInvestibleSearches } from '../../store/ActiveSearches/reducer';
import { getComments } from '../../store/Comments/reducer';
import { getMarketPresenceName } from '../../utils/marketSelectionFunctions';
import MarketFollowUnfollow from '../../components/AppBarIcons/MarketFollowUnfollow';
import { fetchMarketInvestibleInfo } from '../../utils/postAuthFunctions';
import HelpMovie from '../../components/ModalMovie/HelpMovie';
import { getFlags } from '../../utils/userFunctions'

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
    user,
    history,
    classes,
    investibles,
    location,
  } = props;
  const { location: { hash, pathname } } = history;
  const { isGuest, isAdmin, canInvest } = getFlags(user);

  function getMarketInvestibles() {
    const { investibles } = props;
    if (marketId in investibles) {
      return investibles[marketId];
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
    return searched;
  }

  function getItems() {
    const {
      history: { location: { pathname } },
    } = props;
    const showLogin = /(.+)\/login/.test(pathname.toLowerCase());
    if (!showLogin) {
      if (lastFetchedMarketId !== marketId) {
        setLastFetchedMarketId(marketId);
      }
      fetchMarketInvestibleInfo({ fetchComments: true, ...props });
    }
  }

  function toggleShowFavorite() {
    setShowFavorite(!showFavorite);
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


  let currentInvestibleList = getCurrentInvestibleList();
  if (showFavorite) {
    currentInvestibleList = currentInvestibleList.filter(({ current_user_is_following }) => current_user_is_following);
  }

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
        appBarContent={<InvestibleSearchBox />}
        title={currentMarketName || 'Example Market Name'}
        titleButtons={[<MarketFollowUnfollow user={user} marketId={marketId} />,  <Button
          className={classes.toolbarButton}
          variant="contained"
          color="primary"
          onClick={toggleShowFavorite}
        >
          {intl.formatMessage({ id: showFavorite ? 'showAll' : 'showFavorite' })}
        </Button>]}
      >
        {currentInvestibleList && user && user.market_presence
        && (
          <div className={classes.root}>
            {isAdmin && <HelpMovie name="adminInvestiblesIntro" /> }
            {canInvest && <HelpMovie name="usersInvestiblesIntro" /> }
            <div className={classes.toolbar}>

            </div>
            <div className={classes.content}>
              <InvestibleList
                location={location}
                teamId={user.default_team_id}
                user={user}
                marketId={marketId}
                investibles={currentInvestibleList}
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

    </div>

  );
}

InvestiblesPage.propTypes = {
  dispatch: PropTypes.func.isRequired,
  intl: PropTypes.object.isRequired,
  investibles: PropTypes.object,
  comments: PropTypes.object,
  marketId: PropTypes.string,
  user: PropTypes.object,
  activeInvestibleSearches: PropTypes.object,
  history: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
};

const mapStateToProps = state => ({
  investibles: getInvestibles(state.investiblesReducer),
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
)(injectIntl(withStyles(styles)(withTheme()(withMarketId(React.memo(InvestiblesPage))))));
