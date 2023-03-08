import React, { useContext, useEffect } from 'react';
import PropTypes from 'prop-types'
import { useHistory, useLocation } from 'react-router';
import _ from 'lodash'
import Screen from '../../containers/Screen/Screen'
import {
  decomposeMarketPath, formCommentLink, formInvestibleLink, formMarketLink, navigate,
} from '../../utils/marketIdPathFunctions';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { getInvestible, getMarketInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { getMarket, getMyUserForMarket, marketTokenLoaded } from '../../contexts/MarketsContext/marketsContextHelper'
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext'
import { getComment, getMarketComments } from '../../contexts/CommentsContext/commentsContextHelper';
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import PlanningInvestible from './Planning/PlanningInvestible'

function createCommentsHash(commentsArray) {
  return _.keyBy(commentsArray, 'id');
}

function Investible(props) {
  const { hidden } = props;
  const location = useLocation();
  const history = useHistory();
  const { hash, pathname } = location;
  const { marketId, investibleId } = decomposeMarketPath(pathname);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const [marketsState, ,tokensHash] = useContext(MarketsContext);
  const [commentsState] = useContext(CommentsContext);
  const realMarket = getMarket(marketsState, marketId);
  const market = realMarket || {};
  const { parent_comment_id: aParentCommentId, parent_comment_market_id: aParentMarketId } = market;
  const parentComment = getComment(commentsState, aParentMarketId, aParentCommentId) || {};
  const { investible_id: parentInvestibleId, market_id: parentMarketId, group_id: parentGroupId } = parentComment;
  const userId = getMyUserForMarket(marketsState, marketId) || '';
  const comments = getMarketComments(commentsState, marketId);
  const investibleComments = comments.filter((comment) => comment.investible_id === investibleId);
  const commentsHash = createCommentsHash(investibleComments);
  const [investiblesState] = useContext(InvestiblesContext);
  const investibles = getMarketInvestibles(investiblesState, marketId);
  const inv = getInvestible(investiblesState, investibleId);
  const { investible } = inv || {};
  const { name } = investible || {};
  const myPresence = marketPresences.find((presence) => presence.current_user);
  const loading = !investibleId || _.isEmpty(inv) || _.isEmpty(investible) || _.isEmpty(myPresence) || !userId
    || _.isEmpty(realMarket) || !marketTokenLoaded(marketId, tokensHash);
  const isAdmin = myPresence && myPresence.is_admin;

  useEffect(() => {
    if (parentInvestibleId) {
      navigate(history, `${formInvestibleLink(parentMarketId, parentInvestibleId)}#option${investibleId}`);
    } else if (parentMarketId) {
      navigate(history, `${formMarketLink(parentMarketId, parentGroupId)}#option${investibleId}`);
    }
  },  [parentMarketId, investibleId, parentInvestibleId, parentGroupId, history]);

  if (loading) {
    return (
      <Screen
        title={name}
        tabTitle={name}
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
      hash={hash}
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
