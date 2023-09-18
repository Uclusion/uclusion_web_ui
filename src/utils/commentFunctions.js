import _ from 'lodash'
import { addInvestible, getInvestible } from '../contexts/InvestibesContext/investiblesContextHelper'
import {
  getAcceptedStage,
  getBlockedStage,
  getFullStage, getInCurrentVotingStage,
  getRequiredInputStage, isFurtherWorkStage, isInReviewStage
} from '../contexts/MarketStagesContext/marketStagesContextHelper';
import { ISSUE_TYPE, QUESTION_TYPE, REPORT_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE } from '../constants/comments';
import { addCommentToMarket, addMarketComments } from '../contexts/CommentsContext/commentsContextHelper';
import { pushMessage } from './MessageBusUtils'
import { LOAD_EVENT } from '../contexts/InvestibesContext/investiblesContextMessages'
import { INITIATIVE_TYPE } from '../constants/markets'
import { createInitiative } from '../api/markets'
import { addMarket } from '../contexts/MarketsContext/marketsContextHelper'
import TokenStorageManager from '../authorization/TokenStorageManager'
import { PUSH_INVESTIBLES_CHANNEL } from '../api/versionedFetchUtils'
import { removeMessagesForCommentId } from './messageUtils';
import { getMarketInfo } from './userFunctions';
import { TOKEN_TYPE_MARKET } from '../api/tokenConstants';

export function onCommentOpen(investibleState, investibleId, marketStagesState, marketId, comment, investibleDispatch,
  commentsState, commentsDispatch, myPresence) {
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
  if (investibleId) {
    changeInvestibleStageOnCommentOpen(investibleBlocks, investibleRequiresInput, marketStagesState, market_infos,
      rootInvestible, investibleDispatch, comment, myPresence);
  }
  addCommentToMarket(comment, commentsState, commentsDispatch);
}

export function getThreads(parents, comments) {
  const thread = [];
  parents?.forEach((comment) => {
    thread.push(comment);
    comments.forEach((treeCandidate) => {
      const { root_comment_id: rootId } = treeCandidate;
      if (comment.id === rootId) {
        thread.push(treeCandidate);
      }
    })
  });
  return thread;
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

export function handleAcceptSuggestion(info) {
  const { isMove, comment, investible, investiblesDispatch, marketStagesState, commentsState,
    commentsDispatch, messagesState, messagesDispatch } = info;
  if (isMove) {
    const marketInfo = getMarketInfo(investible, comment.market_id);
    changeInvestibleStageOnCommentClose([marketInfo], investible.investible, investiblesDispatch,
      comment, marketStagesState);
  }
  addCommentToMarket(comment, commentsState, commentsDispatch);
  removeMessagesForCommentId(comment.id, messagesState, messagesDispatch);
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

export function onCommentsMove(fromCommentIds, messagesState, marketComments, investibleId, commentsDispatch, marketId,
  movedComments) {
  let threads = []
  fromCommentIds.forEach((commentId) => {
    removeMessagesForCommentId(commentId, messagesState);
    const thread = marketComments.filter((aComment) => {
      return aComment.root_comment_id === commentId;
    });
    const fixedThread = thread.map((aComment) => {
      return {...aComment, investible_id: investibleId};
    });
    threads = threads.concat(fixedThread);
  });
  addMarketComments(commentsDispatch, marketId, [...movedComments, ...threads]);
}

export function changeInvestibleStageOnCommentOpen(investibleBlocks, investibleRequiresInput, marketStagesState,
  market_infos, rootInvestible, investibleDispatch, comment, myPresence) {
  const [info] = (market_infos || []);
  const { stage, assigned } = (info || {});
  let newStage;
  if (investibleBlocks || investibleRequiresInput) {
    const requiresInputStage = getRequiredInputStage(marketStagesState, comment.market_id) || {};
    const blockingStage = getBlockedStage(marketStagesState, comment.market_id) || {};
    newStage = investibleBlocks ? blockingStage : requiresInputStage;
  } else if (comment.comment_type === TODO_TYPE) {
    const fullStage = getFullStage(marketStagesState, comment.market_id, stage);
    if (isInReviewStage(fullStage)) {
      if (assigned?.includes(myPresence?.id)) {
        newStage = getAcceptedStage(marketStagesState, comment.market_id) || {};
      } else {
        newStage = getInCurrentVotingStage(marketStagesState, comment.market_id) || {};
      }
    }
  }
  if (newStage) {
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

export function getCommentsSortedByType(marketComments, investibleId, includeStatusReports, includeResolvedTodos) {
  const commentsRaw = marketComments.filter((comment) => comment.investible_id === investibleId &&
    (!comment.resolved || (includeResolvedTodos && comment.comment_type === TODO_TYPE)) &&
    ([TODO_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE, ISSUE_TYPE].includes(comment.comment_type) ||
      (includeStatusReports && comment.comment_type === REPORT_TYPE)));
  // include children of all raw
  const comments = getThreads(commentsRaw, marketComments);
  return _.orderBy(comments, [(comment) => {
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