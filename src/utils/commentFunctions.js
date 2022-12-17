import _ from 'lodash'
import { addInvestible, getInvestible } from '../contexts/InvestibesContext/investiblesContextHelper'
import { getBlockedStage, getRequiredInputStage } from '../contexts/MarketStagesContext/marketStagesContextHelper'
import { ISSUE_TYPE, QUESTION_TYPE, REPORT_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE } from '../constants/comments';
import { addCommentToMarket } from '../contexts/CommentsContext/commentsContextHelper'
import { pushMessage } from './MessageBusUtils'
import { LOAD_EVENT } from '../contexts/InvestibesContext/investiblesContextMessages'
import { formCommentLink } from './marketIdPathFunctions'
import { addMessage } from '../contexts/NotificationsContext/notificationsContextReducer'
import { RED_LEVEL } from '../constants/notifications'
import { INITIATIVE_TYPE, PLANNING_TYPE } from '../constants/markets'
import { createInitiative } from '../api/markets'
import { addMarket } from '../contexts/MarketsContext/marketsContextHelper'
import TokenStorageManager, { TOKEN_TYPE_MARKET } from '../authorization/TokenStorageManager'
import { PUSH_INVESTIBLES_CHANNEL } from '../api/versionedFetchUtils'

export function onCommentOpen(investibleState, investibleId, marketStagesState, marketId, comment, investibleDispatch,
  commentsState, commentsDispatch) {
  const inv = getInvestible(investibleState, investibleId) || {}
  const { market_infos, investible: rootInvestible } = inv;
  const [info] = (market_infos || []);
  const { assigned, stage: currentStageId } = (info || {});
  const blockingStage = getBlockedStage(marketStagesState, marketId) || {};
  const requiresInputStage = getRequiredInputStage(marketStagesState, marketId) || {};
  const investibleRequiresInput = ((comment.comment_type === QUESTION_TYPE ||
    comment.comment_type === SUGGEST_CHANGE_TYPE)
    && (assigned || []).includes(comment.created_by)) && currentStageId !== blockingStage.id
    && currentStageId !== requiresInputStage.id;
  const investibleBlocks = (investibleId && comment.comment_type === ISSUE_TYPE)
    && currentStageId !== blockingStage.id;
  changeInvestibleStageOnCommentChange(investibleBlocks, investibleRequiresInput,
    blockingStage, requiresInputStage, info, market_infos, rootInvestible, investibleDispatch, comment);
  addCommentToMarket(comment, commentsState, commentsDispatch);
}

export function getThreadIds(parents, comments) {
  const commentIds = [];
  parents.forEach((comment) => {
    commentIds.push(comment.id);
    comments.forEach((treeCandidate) => {
      const { root_comment_id: rootId } = treeCandidate;
      if (comment.id === rootId) {
        commentIds.push(treeCandidate.id);
      }
    })
  });
  return commentIds;
}

export function changeInvestibleStageOnCommentChange(investibleBlocks, investibleRequiresInput,
  blockingStage, requiresInputStage, info, market_infos, rootInvestible, investibleDispatch, comment) {
  if (investibleBlocks || investibleRequiresInput) {
    const [info] = (market_infos || []);
    const { assigned } = (info || {});
    const newStage = investibleBlocks ? blockingStage : requiresInputStage;
    if (newStage.id || _.isEmpty(assigned)) {
      // If in further work just remove ready to start
      const newInfo = {
        ...info,
        open_for_investment: false,
        last_stage_change_date: comment.updated_at,
      };
      if (!_.isEmpty(assigned)) {
        newInfo.stage = newStage.id;
        newInfo.stage_name = newStage.name;
      }
      const newInfos = _.unionBy([newInfo], market_infos, 'id');
      const newInvestible = {
        investible: rootInvestible,
        market_infos: newInfos
      };
      if (investibleDispatch) {
        // no diff here, so no diff dispatch
        addInvestible(investibleDispatch, () => {}, newInvestible);
      } else {
        pushMessage(PUSH_INVESTIBLES_CHANNEL, { event: LOAD_EVENT, investibles: [newInvestible] });
      }
    }
  }
}

export function allowVotingForSuggestion(commentId, setOperationRunning, marketsDispatch, presenceDispatch,
  commentState, commentDispatch, investiblesDispatch, isRestricted) {
  const addInfo = {
    name: 'NA',
    market_type: INITIATIVE_TYPE,
    description: 'NA',
    parent_comment_id: commentId,
  };
  if (isRestricted) {
    addInfo.is_restricted = true;
  }
  return createInitiative(addInfo)
    .then((result) => {
      addMarket(result, marketsDispatch, () => {}, presenceDispatch);
      const { market: { id: inlineMarketId }, parent, token, investible } = result;
      addCommentToMarket(parent, commentState, commentDispatch);
      addInvestible(investiblesDispatch, () => {}, investible);
      setOperationRunning(false);
      const tokenStorageManager = new TokenStorageManager();
      return tokenStorageManager.storeToken(TOKEN_TYPE_MARKET, inlineMarketId, token);
    });
}

export function notifyImmediate(userId, comment, messagesDispatch) {
  const marketId = comment.market_id;
  const commentLink = formCommentLink(marketId, comment.group_id, comment.investible_id, comment.id);
  const notificationType = 'ISSUE';
  messagesDispatch(addMessage({ market_id_user_id: `${marketId}_${userId}`,
    type_object_id: `${notificationType}_${comment.id}`, type: notificationType, market_id: marketId,
    comment_id: comment.id, user_id: userId, text: 'Please assign', level: RED_LEVEL,
    is_highlighted: false, name: 'Immediate TODOs', link: commentLink, market_type: PLANNING_TYPE,
    link_type: 'MARKET_TODO' }));
}

export function getCommentsSortedByType(marketComments, investibleId, includeStatusReports) {
  const commentsRaw = marketComments.filter((comment) => comment.investible_id === investibleId && !comment.resolved &&
    (comment.comment_type === TODO_TYPE ||
      (includeStatusReports && comment.comment_type === REPORT_TYPE && comment.creator_assigned)));
  return _.orderBy(commentsRaw, [(comment) => {
    const { comment_type: commentType } = comment;
    switch (commentType) {
      case 'REPORT_TYPE':
        return 2;
      default:
        return 1;
    }
  }], ['desc'] );
}