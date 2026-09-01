import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types'
import { useHistory, useLocation } from 'react-router';
import _ from 'lodash'
import Screen from '../../containers/Screen/Screen'
import {
  decomposeMarketPath, formInvestibleLink, formMarketLink, navigate,
} from '../../utils/marketIdPathFunctions';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { getInvestible, getMarketInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { getMarket, marketTokenLoaded } from '../../contexts/MarketsContext/marketsContextHelper'
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext'
import {
  addCommentsToMarket,
  getComment,
  getMarketComments
} from '../../contexts/CommentsContext/commentsContextHelper';
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext'
import { getFullStage } from '../../contexts/MarketStagesContext/marketStagesContextHelper'
import { getMarketInfo } from '../../utils/userFunctions'
import { fetchInvestibleComments } from '../../api/comments'
import { ARCHIVED_COMMENTS_SCREEN_MILLIS } from '../../constants/comments'
import PlanningInvestible from './Planning/PlanningInvestible'

function createCommentsHash(commentsArray) {
  return _.keyBy(commentsArray, 'id');
}

// Once per session - a fetch for an archived job's comments is not repeated on revisit, and a
// failed fetch is not retried so the page degrades to today's empty sections instead of looping
const archivedCommentsFetched = new Set();

function Investible(props) {
  const { hidden = false } = props;
  const location = useLocation();
  const history = useHistory();
  const { hash, pathname } = location;
  const { marketId, investibleId } = decomposeMarketPath(pathname);
  // J-all-325: the add-comment hotkeys (ctrl+a/q, ctrl+alt+s/b/n) now live in PlanningInvestible so they
  // open the wizard inline inside the job container instead of on the full-screen /wizard route.
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const [marketsState, ,tokensHash] = useContext(MarketsContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const realMarket = getMarket(marketsState, marketId);
  const market = realMarket || {};
  const { parent_comment_id: aParentCommentId, parent_comment_market_id: aParentMarketId } = market;
  const parentComment = getComment(commentsState, aParentMarketId, aParentCommentId) || {};
  const { investible_id: parentInvestibleId, market_id: parentMarketId, group_id: parentGroupId, 
    resolved: parentResolved } = parentComment;
  const comments = getMarketComments(commentsState, marketId);
  const unSentComments = getMarketComments(commentsState, marketId, undefined, true);
  const investibleComments = comments.filter((comment) => comment.investible_id === investibleId);
  const unSentInvestibleComments = unSentComments.filter((comment) => comment.investible_id === investibleId);
  const commentsHash = createCommentsHash(investibleComments);
  const [investiblesState] = useContext(InvestiblesContext);
  const investibles = getMarketInvestibles(investiblesState, marketId);
  const inv = getInvestible(investiblesState, investibleId);
  const { investible } = inv || {};
  const { name } = investible || {};
  const myPresence = marketPresences.find((presence) => presence.current_user);
  const userId = myPresence?.id;
  const [marketStagesState] = useContext(MarketStagesContext);
  const [archivedCommentsBusy, setArchivedCommentsBusy] = useState(false);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const fullStage = getFullStage(marketStagesState, marketId, marketInfo.stage) || {};
  // The versions call screens out comments archived over 90 days (see ARCHIVED_COMMENTS_SCREEN_MILLIS),
  // so a job in a close comments stage that long must go back to the server for them (J-all-331)
  const needsArchivedCommentsFetch = !hidden && fullStage.close_comments_on_entrance &&
    marketInfo.last_stage_change_date &&
    Date.now() - new Date(marketInfo.last_stage_change_date).getTime() > ARCHIVED_COMMENTS_SCREEN_MILLIS &&
    !archivedCommentsFetched.has(investibleId);
  const loading = !investibleId || _.isEmpty(inv) || _.isEmpty(investible) || _.isEmpty(myPresence) || !userId
    || _.isEmpty(realMarket) || !marketTokenLoaded(marketId, tokensHash)
    || ((needsArchivedCommentsFetch || archivedCommentsBusy) && _.isEmpty(investibleComments));
  const isAdmin = myPresence && myPresence.is_admin;

  useEffect(() => {
    if (needsArchivedCommentsFetch && marketId) {
      archivedCommentsFetched.add(investibleId);
      setArchivedCommentsBusy(true);
      fetchInvestibleComments(investibleId, marketId).then((archivedComments) => {
        const marked = (archivedComments || []).map((comment) => ({ ...comment, doNotPersist: true }));
        if (!_.isEmpty(marked)) {
          addCommentsToMarket(marked, commentsState, commentsDispatch);
        }
        setArchivedCommentsBusy(false);
      }).catch(() => setArchivedCommentsBusy(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsArchivedCommentsFetch, investibleId, marketId]);

  useEffect(() => {
    if (!hidden && !hash.includes('option')) {
      if (parentInvestibleId) {
        console.info("Handling option investible navigation.");
        navigate(history, `${formInvestibleLink(parentMarketId, parentInvestibleId)}#option${investibleId}`);
      } else if (parentMarketId && !hidden) {
        console.info("Handling option navigation.");
        navigate(history, `${formMarketLink(parentMarketId, parentGroupId)}#option${investibleId}`);
      }
    }
  },  [hash, parentMarketId, investibleId, parentInvestibleId, parentGroupId, history, hidden]);

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
      marketId={marketId}
      market={market}
      inArchives={parentResolved}
      marketInvestible={inv}
      investibles={investibles}
      commentsHash={commentsHash}
      marketPresences={marketPresences}
      investibleComments={investibleComments}
      unSentInvestibleComments={unSentInvestibleComments}
      isAdmin={isAdmin}
      hash={hash}
      hidden={hidden}
    />
  );
}

Investible.propTypes = {
  hidden: PropTypes.bool,
};

export default Investible;
