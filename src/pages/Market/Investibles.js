/* eslint-disable react/forbid-prop-types */
import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import { Button } from '@material-ui/core';
import { injectIntl } from 'react-intl';
import { getInvestibles } from '../../store/MarketInvestibles/reducer';
import Activity from '../../containers/Activity/Activity';
import InvestibleList from '../Investibles/InvestibleList';
import InvestibleDetail from '../Investibles/InvestibleDetail';
import { withMarketId } from '../../components/PathProps/MarketId';
import { getActiveInvestibleSearches } from '../../store/ActiveSearches/reducer';
import { getComments } from '../../store/Comments/reducer';
import { fetchMarketInvestibleInfo } from '../../utils/postAuthFunctions';
import HelpMovie from '../../components/ModalMovie/HelpMovie';
import { getFlags } from '../../utils/userFunctions';
import InvestibleAddButton from '../Investibles/InvestibleAddButton';
import useMarketsContext from '../../contexts/useMarketsContext';

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

function Investibles(props) {
  const [lastFetchedMarketId, setLastFetchedMarketId] = useState(undefined);
  const [showFavorite, setShowFavorite] = useState(false);
  const { currentMarket } = useMarketsContext();

  const {
    intl,
    user,
    history,
    classes,
    investibles,
    location,
  } = props;

  const marketId = currentMarket.id;
  const { location: { hash, pathname } } = history;
  const { isAdmin, canInvest } = getFlags(user);

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
    if (lastFetchedMarketId !== marketId) {
      setLastFetchedMarketId(marketId);
    }
    fetchMarketInvestibleInfo({ fetchComments: true, marketId, ...props });
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


  // TODO: give choice of teamId instead of default
  return (

    <div>

      <Activity
        isLoading={currentInvestibleList === undefined || user === undefined}
        containerStyle={{ overflow: 'hidden' }}
        appBarContent={[<InvestibleAddButton />]}
        title={currentMarket.name}
        titleButtons={[<Button
          className={classes.toolbarButton}
          variant="contained"
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

Investibles.propTypes = {
  dispatch: PropTypes.func.isRequired,
  intl: PropTypes.object.isRequired,
  investibles: PropTypes.object,
  comments: PropTypes.object,
  marketId: PropTypes.string,
  user: PropTypes.object,
  activeInvestibleSearches: PropTypes.object,
  markets: PropTypes.arrayOf(PropTypes.object),
  classes: PropTypes.arrayOf(PropTypes.object),
  history: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
};

const mapStateToProps = state => ({
  investibles: getInvestibles(state.investiblesReducer),
  comments: getComments(state.commentsReducer),

  activeInvestibleSearches: getActiveInvestibleSearches(state.activeSearches),
});

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(injectIntl(withStyles(styles)(withMarketId(React.memo(Investibles)))));
