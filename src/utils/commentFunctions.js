import _ from 'lodash'
import { addInvestible, getInvestible } from '../contexts/InvestibesContext/investiblesContextHelper'
import {
  getBlockedStage,
  getFullStage, getInCurrentVotingStage,
  getRequiredInputStage, isFurtherWorkStage
} from '../contexts/MarketStagesContext/marketStagesContextHelper';
import { ISSUE_TYPE, QUESTION_TYPE, REPORT_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE } from '../constants/comments';
import { addCommentToMarket } from '../contexts/CommentsContext/commentsContextHelper'
import { pushMessage } from './MessageBusUtils'
import { LOAD_EVENT } from '../contexts/InvestibesContext/investiblesContextMessages'
import { INITIATIVE_TYPE } from '../constants/markets'
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
  changeInvestibleStageOnCommentOpen(investibleBlocks, investibleRequiresInput,
    blockingStage, requiresInputStage, market_infos, rootInvestible, investibleDispatch, comment);
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

function changeInvestibleStage(newStage, assigned, updatedAt, info, market_infos, rootInvestible, investibleDispatch) {
  if (newStage?.id || _.isEmpty(assigned)) {
    // If in further work just remove ready to start
    const newInfo = {
      ...info,
      open_for_investment: false,
      last_stage_change_date: updatedAt,
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

export function changeInvestibleStageOnCommentClose(market_infos, rootInvestible, investibleDispatch, comment,
  marketStagesState) {
  const [info] = (market_infos || []);
  const { former_stage_id: formerStageId, assigned, market_id: marketId } = (info || {});
  const nextStageId = getFormerStageId(formerStageId, marketId, marketStagesState);
  const newStage = getFullStage(marketStagesState, marketId, nextStageId);
  changeInvestibleStage(newStage, assigned, comment.updated_at, info, market_infos, rootInvestible,
    investibleDispatch);
}

export function changeInvestibleStageOnCommentOpen(investibleBlocks, investibleRequiresInput,
  blockingStage, requiresInputStage, market_infos, rootInvestible, investibleDispatch, comment) {
  if (investibleBlocks || investibleRequiresInput) {
    const [info] = (market_infos || []);
    const { assigned } = (info || {});
    const newStage = investibleBlocks ? blockingStage : requiresInputStage;
    changeInvestibleStage(newStage, assigned, comment.updated_at, info, market_infos, rootInvestible,
      investibleDispatch);
  }
}

export function allowVotingForSuggestion(commentId, setOperationRunning, marketsDispatch, presenceDispatch,
  commentState, commentDispatch, investiblesDispatch, isRestricted) {
  const addInfo = {
    market_type: INITIATIVE_TYPE,
    parent_comment_id: commentId,
  };
  if (isRestricted) {
    addInfo.is_restricted = true;
  }
  return createInitiative(addInfo)
    .then((result) => {
      addMarket(result, marketsDispatch, presenceDispatch);
      const { market: { id: inlineMarketId }, parent, token, investible } = result;
      addCommentToMarket(parent, commentState, commentDispatch);
      addInvestible(investiblesDispatch, () => {}, investible);
      setOperationRunning(false);
      const tokenStorageManager = new TokenStorageManager();
      return tokenStorageManager.storeToken(TOKEN_TYPE_MARKET, inlineMarketId, token);
    });
}

export function getCommentsSortedByType(marketComments, investibleId, includeStatusReports) {
  const commentsRaw = marketComments.filter((comment) => comment.investible_id === investibleId && !comment.resolved &&
    ([TODO_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE, ISSUE_TYPE].includes(comment.comment_type) ||
      (includeStatusReports && comment.comment_type === REPORT_TYPE)));
  return _.orderBy(commentsRaw, [(comment) => {
    const { comment_type: commentType } = comment;
    switch (commentType) {
      case REPORT_TYPE:
        return 2;
      case TODO_TYPE:
        return 1;
      default:
        return 0;
    }
  }], ['desc'] );
}

export function getFormerStageId(formerStageId, marketId, marketStagesState) {
  if (!formerStageId) {
    return formerStageId;
  }
  const formerStage = getFullStage(marketStagesState, marketId, formerStageId);
  if (!isFurtherWorkStage(formerStage)) {
    return formerStageId;
  }
  return (getInCurrentVotingStage(marketStagesState, marketId) || {}).id;
}

export function isSingleAssisted(comments, assigned) {
  if (_.isEmpty(assigned)) {
    return false;
  }
  return _.size(comments.filter(
    comment => (comment.comment_type === QUESTION_TYPE || comment.comment_type === SUGGEST_CHANGE_TYPE)
      && !comment.resolved && assigned.includes(comment.created_by))) +
    _.size(comments.filter(comment => comment.comment_type === ISSUE_TYPE && !comment.resolved)) === 1;
}