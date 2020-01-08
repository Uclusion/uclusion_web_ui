import React, { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import {
  decomposeMarketPath, formInvestibleLink, navigate,
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
  const { location } = history;
  const { pathname } = location;
  const { marketId } = decomposeMarketPath(pathname);
  const [marketsState] = useContext(MarketsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentsState] = useContext(CommentsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const investibles = getMarketInvestibles(investiblesState, marketId);
  const comments = getMarketComments(commentsState, marketId);
  const renderableMarket = getMarket(marketsState, marketId) || {};
  const { market_type: marketType } = renderableMarket || '';
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
    if (marketType === INITIATIVE_TYPE && Array.isArray(investibles) && investibles.length > 0) {
      getInitiativeInvestible(investibles[0]);
    }
    return () => {
    };
  }, [marketType, investibles, marketId, history]);

  if (loading) {
    return (
      <Screen
        hidden={hidden}
        tabTitle="Loading"
      >
        <div />
      </Screen>
    );
  }

  return (
    <>
      {marketType === DECISION_TYPE && (
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
