import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router';
import _ from 'lodash';
import Screen from '../../containers/Screen/Screen';
import {
  makeBreadCrumbs,
  formMarketLink,
  decomposeMarketPath, navigate, formInvestibleLinkWithPrefix,
} from '../../utils/marketIdPathFunctions';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { getInvestible, getMarketInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { getMarket, getMyUserForMarket } from '../../contexts/MarketsContext/marketsContextHelper';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import { getMarketComments } from '../../contexts/CommentsContext/commentsContextHelper';
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import DecisionInvestible from './Decision/DecisionInvestible';
import PlanningInvestible from './Planning/PlanningInvestible';
import { DECISION_TYPE, PLANNING_TYPE } from '../../constants/markets';
import InitiativeInvestible from './Initiative/InitiativeInvestible';

const emptyInvestible = { investible: { name: '', description: '' } };
const emptyMarket = { name: '' };

function createCommentsHash(commentsArray) {
  return _.keyBy(commentsArray, 'id');
}

function Investible(props) {
  const { hidden } = props;
  const history = useHistory();
  const { location } = history;
  const { pathname } = location;
  const { marketId, investibleId } = decomposeMarketPath(pathname);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId);
  const [marketsState] = useContext(MarketsContext);
  const market = getMarket(marketsState, marketId) || emptyMarket;
  const user = getMyUserForMarket(marketsState, marketId) || {};
  const userId = user.id;
  const [commentsState] = useContext(CommentsContext);
  const comments = getMarketComments(commentsState, marketId);
  const investibleComments = comments.filter((comment) => comment.investible_id === investibleId);
  const commentsHash = createCommentsHash(investibleComments);
  const [investiblesState] = useContext(InvestiblesContext);
  const investibles = getMarketInvestibles(investiblesState, marketId);
  const inv = getInvestible(investiblesState, investibleId);
  const usedInv = inv || emptyInvestible;
  const { investible } = usedInv;
  const { name } = investible;
  const breadCrumbTemplates = [{ name: market.name, link: formMarketLink(marketId) }];
  const breadCrumbs = makeBreadCrumbs(history, breadCrumbTemplates, true);
  const myPresence = marketPresences && marketPresences.find((presence) => presence.current_user);
  const loading = (!investibleId || _.isEmpty(inv) || _.isEmpty(myPresence) || _.isEmpty(user));
  const isDecision = market && market.market_type === DECISION_TYPE;
  const isPlanning = market && market.market_type === PLANNING_TYPE;

  const isAdmin = myPresence && myPresence.is_admin;

  function toggleEdit() {
    navigate(history, formInvestibleLinkWithPrefix('investibleEdit', marketId, investibleId));
  }

  if (loading) {
    return (
      <Screen
        title={name}
        tabTitle={name}
        breadCrumbs={breadCrumbs}
        hidden={hidden}
        loading={loading}
      >
        <div />
      </Screen>
    );
  }

  if (isDecision) {
    return (
      <DecisionInvestible
        userId={userId}
        investibleId={investibleId}
        market={market}
        fullInvestible={usedInv}
        comments={comments}
        marketPresences={marketPresences}
        investibleComments={investibleComments}
        toggleEdit={toggleEdit}
        isAdmin={isAdmin}
        hidden={hidden}
      />
    );
  }

  if (isPlanning) {
    return (
      <PlanningInvestible
        userId={userId}
        investibleId={investibleId}
        market={market}
        marketInvestible={inv}
        investibles={investibles}
        commentsHash={commentsHash}
        marketPresences={marketPresences}
        investibleComments={investibleComments}
        toggleEdit={toggleEdit}
        isAdmin={isAdmin}
        hidden={hidden}
      />
    );
  }
  return (
    <InitiativeInvestible
      userId={userId}
      investibleId={investibleId}
      market={market}
      fullInvestible={usedInv}
      marketPresences={marketPresences}
      investibleComments={investibleComments}
      toggleEdit={toggleEdit}
      isAdmin={isAdmin}
    />
  );
}

Investible.propTypes = {
  hidden: PropTypes.bool,
};

Investible.defaultProps = {
  hidden: false,
};

export default Investible;
