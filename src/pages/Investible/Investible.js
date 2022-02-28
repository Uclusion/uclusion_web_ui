import React, { useContext, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useHistory, useLocation } from 'react-router'
import _ from 'lodash'
import Screen from '../../containers/Screen/Screen'
import {
  decomposeMarketPath,
  formMarketLink,
  makeBreadCrumbs,
} from '../../utils/marketIdPathFunctions'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { getInvestible, getMarketInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { getMarket, getMyUserForMarket, marketTokenLoaded } from '../../contexts/MarketsContext/marketsContextHelper'
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext'
import { getMarketComments } from '../../contexts/CommentsContext/commentsContextHelper'
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import PlanningInvestible from './Planning/PlanningInvestible'
import { pushMessage } from '../../utils/MessageBusUtils'
import { GUEST_MARKET_EVENT, LOAD_MARKET_CHANNEL } from '../../contexts/MarketsContext/marketsContextMessages'

function createCommentsHash(commentsArray) {
  return _.keyBy(commentsArray, 'id');
}

function Investible(props) {
  const { hidden } = props;
  const history = useHistory();
  const location = useLocation();
  const { pathname } = location;
  const { marketId, investibleId } = decomposeMarketPath(pathname);
  const myParams = new URL(document.location).searchParams;
  const subscribeId = myParams ? myParams.get('subscribeId') : undefined;
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId);
  const [marketsState, ,tokensHash] = useContext(MarketsContext);
  const realMarket = getMarket(marketsState, marketId);
  const market = realMarket || {};
  const userId = getMyUserForMarket(marketsState, marketId) || '';
  const [commentsState] = useContext(CommentsContext);
  const comments = getMarketComments(commentsState, marketId);
  const investibleComments = comments.filter((comment) => comment.investible_id === investibleId);
  const commentsHash = createCommentsHash(investibleComments);
  const [investiblesState] = useContext(InvestiblesContext);
  const isInitialization = investiblesState.initializing || marketsState.initializing || marketPresencesState.initializing || commentsState.initializing;
  const investibles = getMarketInvestibles(investiblesState, marketId);
  const inv = getInvestible(investiblesState, investibleId);
  const { investible } = inv || {};
  const { name } = investible || {};
  const { name: marketName } = market || {};
  const breadCrumbTemplates = [{ name: marketName, link: formMarketLink(marketId), id: 'marketCrumb' }];
  const myPresence = marketPresences && marketPresences.find((presence) => presence.current_user);
  const loading = !investibleId || _.isEmpty(inv) || _.isEmpty(investible) || _.isEmpty(myPresence) || !userId
    || _.isEmpty(realMarket) || !marketTokenLoaded(marketId, tokensHash);
  const isAdmin = myPresence && myPresence.is_admin;
  const breadCrumbs = makeBreadCrumbs(history, breadCrumbTemplates);

  useEffect(() => {
    if (!isInitialization && !hidden && marketId && subscribeId) {
      // Do not support copy and paste from regular URL because might cause performance issue
      pushMessage(LOAD_MARKET_CHANNEL, { event: GUEST_MARKET_EVENT, marketId, subscribeId });
      if (subscribeId === investibleId) {
        // Comments will be handled by scroll context
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, [hidden, investibleId, isInitialization, marketId, subscribeId]);

  if (loading) {
    return (
      <Screen
        title={name}
        tabTitle={name}
        breadCrumbs={breadCrumbs}
        hidden={hidden}
        loading
      >
        <div />
      </Screen>
    );
  }

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
      isAdmin={isAdmin}
      hidden={hidden}
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
