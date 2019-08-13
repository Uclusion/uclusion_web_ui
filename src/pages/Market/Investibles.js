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


  let currentInvestibleList = [];


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
  classes: PropTypes.arrayOf(PropTypes.object),
  history: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
};

const mapStateToProps = state => ({
  investibles: getInvestibles(state.investiblesReducer),
  comments: getComments(state.commentsReducer),
});

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(injectIntl(withStyles(styles)(withMarketId(React.memo(Investibles)))));
