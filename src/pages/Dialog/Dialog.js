import React, { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { useIntl } from 'react-intl';
import _ from 'lodash';
import {
  decomposeMarketPath, formatMarketLinkWithPrefix, formInvestibleLink, navigate,
} from '../../utils/marketIdPathFunctions';
import Screen from '../../containers/Screen/Screen';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { getMarket } from '../../contexts/MarketsContext/marketsContextHelper';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { getMarketInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper';
import DecisionDialog from './Decision/DecisionDialog';
import PlanningDialog from './Planning/PlanningDialog';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import { getMarketComments } from '../../contexts/CommentsContext/commentsContextHelper';
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext';
import { getStages } from '../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import { DECISION_TYPE, INITIATIVE_TYPE, PLANNING_TYPE } from '../../constants/markets';
import queryString from 'query-string'

const styles = (theme) => ({
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
    margin: theme.spacing(1),
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  hidden: {
    display: 'none',
  },
  dialog: {},
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

function Dialog(props) {
  const { hidden } = props;
  const [addInvestibleMode, setAddInvestibleMode] = useState(false);
  const history = useHistory();
  const intl = useIntl();
  const { location } = history;
  const { pathname, hash } = location;
  const values = queryString.parse(hash || '');
  const { fromInvite } = values || {};
  const isFromInvite = fromInvite === 'true';
  const { marketId } = decomposeMarketPath(pathname);
  const [marketsState] = useContext(MarketsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentsState] = useContext(CommentsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const investibles = getMarketInvestibles(investiblesState, marketId);
  const comments = getMarketComments(commentsState, marketId);
  const loadedMarket = getMarket(marketsState, marketId);
  const renderableMarket = loadedMarket || {};
  const { market_type: marketType } = renderableMarket || '';
  const [isInitialization, setIsInitialization] = useState(false);
  const marketStages = getStages(marketStagesState, marketId);
  const marketPresences = getMarketPresences(marketPresencesState, marketId);
  const myPresence = marketPresences && marketPresences.find((presence) => presence.current_user);
  const loading = !myPresence || !marketType || marketType === INITIATIVE_TYPE;

  useEffect(() => {
    function getInitiativeInvestible(baseInvestible) {
      const {
        investibleId: onInvestibleId,
      } = decomposeMarketPath(history.location.pathname);
      if (onInvestibleId) {
        return;
      }
      const { investible } = baseInvestible;
      const { id } = investible;
      const link = formInvestibleLink(marketId, id);
      navigate(history, link);
    }
    if (!hidden && marketType === INITIATIVE_TYPE && Array.isArray(investibles)
      && investibles.length > 0) {
      getInitiativeInvestible(investibles[0]);
    }
    const loadedMarketAtAll = !(_.isEmpty(loadedMarket) && _.isEmpty(marketStages) && _.isEmpty(marketPresences));
    if (!hidden && !loadedMarketAtAll && !isFromInvite) {
      // console.log('Setting load timer.');
      setTimeout(() => {
        console.warn('Failed to load market after allotted time.');
        setIsInitialization(true);
      }, 3500);
    }
    if (isInitialization && !isFromInvite) {
      setIsInitialization(false);
      if (!loadedMarketAtAll && !hidden) {
        const inviteLink = formatMarketLinkWithPrefix('invite', marketId);
        navigate(history, inviteLink);
      }
    }
    return () => {
    };
  }, [hidden, marketType, investibles, marketId, history, isInitialization, loadedMarket, marketStages,
  marketPresences, isFromInvite]);

  if (loading) {
    return (
      <Screen
        hidden={hidden}
        loading={loading}
        tabTitle={intl.formatMessage({ id: 'loadingMessage' })}
      >
        <div />
      </Screen>
    );
  }

  return (
    <>
      {marketType === DECISION_TYPE && myPresence && (
        <DecisionDialog
          hidden={hidden}
          addInvestibleMode={addInvestibleMode}
          setAddInvestibleMode={setAddInvestibleMode}
          market={renderableMarket}
          investibles={investibles}
          comments={comments}
          marketStages={marketStages}
          marketPresences={marketPresences}
          myPresence={myPresence}

        />
      )}
      {marketType === PLANNING_TYPE && (
        <PlanningDialog
          hidden={hidden}
          addInvestibleMode={addInvestibleMode}
          setAddInvestibleMode={setAddInvestibleMode}
          market={renderableMarket}
          investibles={investibles}
          comments={comments}
          marketStages={marketStages}
          marketPresences={marketPresences}
          myPresence={myPresence}
        />
      )}
    </>
  );
}

Dialog.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default withStyles(styles)(Dialog);
