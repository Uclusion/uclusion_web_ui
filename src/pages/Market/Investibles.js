/* eslint-disable react/forbid-prop-types */
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';
import Activity from '../../containers/Activity/Activity';
import InvestibleList from '../Investibles/InvestibleList';
import InvestibleDetail from '../Investibles/InvestibleDetail';
import { withMarketId } from '../../components/PathProps/MarketId';
// import { getComments } from '../../store/Comments/reducer';
// import HelpMovie from '../../components/ModalMovie/HelpMovie';
import InvestibleAddButton from '../Investibles/InvestibleAddButton';
import useMarketsContext from '../../contexts/useMarketsContext';
import useInvestiblesContext from '../../contexts/useInvestiblesContext';
import { getInvestibleForUrl } from './detailHelper';

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
    margin: theme.spacing(),
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  stageSelector: {
    display: 'flex',
    alignItems: 'center',
    margin: theme.spacing(),
    marginTop: theme.spacing(2),
    width: 384,
    [theme.breakpoints.only('xs')]: {
      width: '100%',
    },
  },
});

function Investibles(props) {
  const { currentMarket, markets, refreshMarkets, switchMarket } = useMarketsContext();
  const { getInvestibles, refreshInvestibles } = useInvestiblesContext();
  const {
    intl,
    history,
    classes,
    location,
    marketId,
  } = props;


  useEffect(() => {
    if(markets) {
      switchMarket(marketId);
    }
  }, [markets]);

  useEffect(() => {
    if (!markets) {
      refreshMarkets();
    }
    refreshInvestibles(marketId);
    const timer = setInterval(() => refreshInvestibles(marketId), pollRate);
    return () => {
      clearInterval(timer);
    };
  }, [marketId]);

  const investibles = getInvestibles(marketId) || [];
  const { location: { pathname }} = history;
  const investibleDetail = getInvestibleForUrl(history, investibles);
  const currentMarketName = (currentMarket && currentMarket.name) || '';
  return (

    <div>

      <Activity
        isLoading={!currentMarketName}
        containerStyle={{ overflow: 'hidden' }}
        appBarContent={[<InvestibleAddButton/>]}
        title={currentMarketName}
      >
        <div className={classes.root}>
          <div className={classes.content}>
            <InvestibleList
              location={location}
              marketId={marketId}
              investibles={investibles}
            />
          </div>
          { investibleDetail && (
            <InvestibleDetail
              investible={investibleDetail}
              onClose={() => history.push(pathname)}
            />
          )}
        </div>
      </Activity>
    </div>

  );
}

Investibles.propTypes = {
  intl: PropTypes.object.isRequired,
  classes: PropTypes.arrayOf(PropTypes.object),
  history: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
};

export default injectIntl(withStyles(styles)(withMarketId(React.memo(Investibles))));
