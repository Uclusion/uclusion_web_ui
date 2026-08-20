import _ from 'lodash'
import { addInvestible, getInvestible } from '../contexts/InvestibesContext/investiblesContextHelper'
import {
  getAcceptedStage,
  getBlockedStage,
  getFullStage, getInCurrentVotingStage,
  getRequiredInputStage, getStages, isFurtherWorkStage, isInReviewStage
} from '../contexts/MarketStagesContext/marketStagesContextHelper';
import {
  ISSUE_TYPE,
  JUSTIFY_TYPE,
  QUESTION_TYPE,
  REPORT_TYPE,
  SUGGEST_CHANGE_TYPE,
  TODO_TYPE
} from '../constants/comments';
import {
  addCommentToMarket,
  addMarketComments,
  getMarketComments
} from '../contexts/CommentsContext/commentsContextHelper';
import { pushMessage } from './MessageBusUtils'
import { LOAD_EVENT } from '../contexts/InvestibesContext/investiblesContextMessages'
import { INITIATIVE_TYPE } from '../constants/markets'
import { createInitiative } from '../api/markets'
import { addMarket } from '../contexts/MarketsContext/marketsContextHelper'
import TokenStorageManager from '../authorization/TokenStorageManager'
import { PUSH_INVESTIBLES_CHANNEL } from '../api/versionedFetchUtils'
import { removeMessagesForCommentId } from './messageUtils';
import { getMarketPresences } from '../contexts/MarketPresencesContext/marketPresencesHelper';
import { TOKEN_TYPE_MARKET } from '../api/tokenConstants';
import { BLUE_LEVEL } from '../constants/notifications';

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

export function getGroupMentionsApprovals(groupId, myPresence, isAutonomous, comments) {
  const { mentioned_notifications: mentionsAll, approve_notifications: approvalsAll } = myPresence;
  let mentions, approvals;
  if (isAutonomous) {
    mentions = mentionsAll;
    approvals = approvalsAll;
  } else {
    const groupComments = (comments || []).filter((comment) => comment.group_id === groupId);
    const groupCommentIds =  groupComments.map((comment) => comment.id);
    mentions = (mentionsAll || []).filter((mentionId) => groupCommentIds.includes(mentionId));
    approvals = (approvalsAll || []).filter((mentionId) => groupCommentIds.includes(mentionId));
  }
  return { mentions, approvals };
}

export function getThreads(parents, comments) {
  const thread = [];
  parents?.forEach((comment) => {
    thread.push(comment);
    comments.forEach((treeCandidate) => {
      const { root_comment_id: rootId } = treeCandidate;
      if (comment.id === rootId && treeCandidate.id !== comment.id) {
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
      if (comment.id === rootId && treeCandidate.id !== comment.id) {
        commentIds.push(treeCandidate.id);
      }
    })
  });
  return commentIds;
}

export function changeInvestibleStage(newStage, assigned, updatedAt, info, market_infos, rootInvestible,
  investibleDispatch) {
  const newInfo = {
    ...info,
    stage: newStage.id,
    stage_name: newStage.name,
    // Record the stage being left like the backend does, so a later
    // changeInvestibleStageOnCommentClose can restore it before sync catches up
    former_stage_id: info?.stage,
    last_stage_change_date: updatedAt
  };
  if (_.isEmpty(assigned)) {
    // If in further work just remove ready to assign
    newInfo.open_for_investment = false;
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

export function extractTodosList(body) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(body, "text/html");

  const liElements = doc.querySelectorAll("li");
  const bodies = [];

  for (const li of liElements) {
    // Use innerHTML so markup like links survives the conversion to a task
    bodies.unshift(`<p>${li.innerHTML.trim()}</p>`);
  }

  return bodies;
}

export function removeTodosFromDescription(description) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(description, "text/html");
  const liElements = doc.querySelectorAll("li");
  for (const li of liElements) {
    li.remove();
  }
  return doc.body.innerHTML;
}

export function handleAcceptSuggestion(info) {
  const { isMove, comment, investible, investiblesDispatch, marketStagesState, commentsState,
    commentsDispatch, messagesState, messagesDispatch } = info;
  if (isMove) {
    changeInvestibleStageOnCommentClose(investible.market_infos, investible.investible, investiblesDispatch,
      comment.updated_at, marketStagesState, comment.market_id);
  }
  addCommentToMarket(comment, commentsState, commentsDispatch);
  removeMessagesForCommentId(comment.id, messagesState, messagesDispatch);
}

export function changeInvestibleStageOnCommentClose(market_infos, rootInvestible, investibleDispatch, updatedAt,
  marketStagesState, targetMarketId) {
  const info = targetMarketId ?
    (market_infos || []).find((marketInfo) => marketInfo.market_id === targetMarketId) :
    (market_infos || [])[0];
  const { former_stage_id: formerStageId, assigned, market_id: marketId } = (info || {});
  const nextStageId = getFormerStageId(formerStageId, marketId, marketStagesState);
  const newStage = getFullStage(marketStagesState, marketId, nextStageId);
  if (!newStage) {
    // No former stage recorded (info was synthesized client-side before T-all-2297 or never stage
    // changed) - leave the stage for sync to fix. Throwing here rejected the move chain and left
    // the wizard spinner running forever (https://stage.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/Q-all-216).
    return;
  }
  changeInvestibleStage(newStage, assigned, updatedAt, info, market_infos, rootInvestible, investibleDispatch);
}

export function onCommentsMove(fromCommentIds, messagesState, marketComments, investibleId, commentsDispatch, marketId,
  movedComments, messagesDispatch) {
  let threads = []
  fromCommentIds.forEach((commentId) => {
    removeMessagesForCommentId(commentId, messagesState, messagesDispatch);
    const movedRoot = movedComments.find((aComment) => aComment.id === commentId);
    const thread = marketComments.filter((aComment) => {
      return aComment.root_comment_id === commentId && aComment.id !== commentId;
    });
    const fixedThread = thread.map((aComment) => {
      // Children follow their root's group so a move across views doesn't strand them
      // while the backend syncs them asynchronously
      return {...aComment, investible_id: investibleId, group_id: movedRoot?.group_id || aComment.group_id};
    });
    threads = threads.concat(fixedThread);
  });
  addMarketComments(commentsDispatch, marketId, [...movedComments, ...threads]);
}

// T-all-2298 / B-all-510: an AI-authored assistance comment is "Responded" once a human reply,
// inline-option comment, or human vote is more recent than the AI's latest comment activity there.
// An AI option vote changes its choice; it does not ask the human for another response (B-all-542).
// Human-authored assistance is never Responded - it waits on the AI or gets resolved. The AI user
// is the only presence without an email.
export function isAssistanceRespondedByHuman(rootComment, investibleComments, marketPresences,
  marketPresencesState, commentsState) {
  const inlineMarketId = rootComment.inline_market_id;
  const inlinePresences = inlineMarketId ?
    (getMarketPresences(marketPresencesState, inlineMarketId) || []) : [];
  const aiPresenceIds = new Set((marketPresences || []).concat(inlinePresences)
    .filter((presence) => _.isEmpty(presence.email))
    .map((presence) => presence.id));
  const isAIPresenceId = (presenceId) => aiPresenceIds.has(presenceId);
  if (!isAIPresenceId(rootComment.created_by)) {
    return false;
  }
  let aiLatest = new Date(rootComment.updated_at).getTime();
  let humanLatest = undefined;
  function activityOwnerOf(comment) {
    // Resolving a root is a new turn by the resolver even though its creator
    // remains unchanged. Other edits keep the creator's chronology role.
    const isDirectResolution = comment.resolved && comment.updated_by &&
      !comment.auto_closed && !comment.last_update_auto_generated;
    return isDirectResolution ? comment.updated_by : comment.created_by;
  }
  function foldCommentActivity(comment) {
    const commentTime = new Date(comment.updated_at).getTime();
    if (isAIPresenceId(activityOwnerOf(comment))) {
      aiLatest = Math.max(aiLatest, commentTime);
    } else {
      humanLatest = Math.max(humanLatest || 0, commentTime);
    }
  }
  const thread = (investibleComments || []).filter((comment) => comment.root_comment_id === rootComment.id &&
    comment.id !== rootComment.id);
  thread.forEach(foldCommentActivity);
  if (inlineMarketId) {
    // Local short codes inside options only make sense with their parent question. Fold every
    // visible comment/reply attached to an option into that parent question's chronology.
    const inlineComments = getMarketComments(commentsState || {}, inlineMarketId)
      .filter((comment) => !!comment.investible_id && comment.comment_type !== JUSTIFY_TYPE);
    // T-all-2449: a live human vote already answers the question. A later AI comment inside an
    // option (like the low-certainty clarification reply) is supplementary - it must not flip
    // the question back to Unresponded. AI edits to the question itself still reopen it.
    const hasLiveHumanVote = inlinePresences.some((presence) => !_.isEmpty(presence.email) &&
      (presence.investments || []).some((investment) =>
        investment.quantity !== undefined && investment.quantity !== null && !investment.deleted));
    const foldedInlineComments = hasLiveHumanVote ?
      inlineComments.filter((comment) => !isAIPresenceId(activityOwnerOf(comment))) : inlineComments;
    foldedInlineComments.forEach(foldCommentActivity);
    inlinePresences.forEach((presence) => {
      const isAI = _.isEmpty(presence.email);
      (presence.investments || []).filter((investment) =>
        investment.quantity !== undefined && investment.quantity !== null && !investment.deleted
      ).forEach((investment) => {
        const investmentTime = new Date(investment.updated_at).getTime();
        if (!isAI) {
          humanLatest = Math.max(humanLatest || 0, investmentTime);
        }
      });
    });
  }
  return humanLatest !== undefined && humanLatest > aiLatest;
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
      (includeStatusReports && comment.comment_type === REPORT_TYPE && comment.notification_type !== BLUE_LEVEL)));
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

export function getWorkflowStageContext(marketStagesState, marketId, currentStage, formerStageId) {
  return {
    stages: getStages(marketStagesState, marketId),
    currentStage: currentStage || {},
    formerStageId,
  };
}

function aiQuestionWasOpenedForExecution(comment, stageContext) {
  if (!stageContext) {
    return true;
  }
  const { stages = [], currentStage = {}, formerStageId } = stageContext;
  const isExecutable = (stage) => ['Doable', 'Reviewable'].includes(stage?.name);
  const isRequiresInput = (stage) => stage?.move_on_comment && !stage?.allows_issues;
  if (!currentStage.id) {
    // Stage definitions can arrive after comments. Conservatively keep the AI question as a
    // blocker until sync supplies enough context to classify its creation lane.
    return true;
  }
  const formerStage = stages.find((stage) => stage.id === formerStageId);
  const laneIsExecutable = isExecutable(currentStage) ||
    (currentStage.move_on_comment && isExecutable(formerStage));
  if (!laneIsExecutable) {
    return false;
  }
  const creationStageId = comment.creation_stage_id;
  if (!creationStageId) {
    return true;
  }
  if (creationStageId === currentStage.id) {
    return isExecutable(currentStage) || isRequiresInput(currentStage);
  }
  if (creationStageId === formerStageId) {
    return isExecutable(formerStage);
  }
  const creationStage = stages.find((stage) => stage.id === creationStageId);
  return isExecutable(creationStage) || isRequiresInput(creationStage);
}

function getOpenWorkflowComments(comments, assigned, marketPresences, includeIssues = true, stageContext) {
  const aiUserIds = new Set((marketPresences || [])
    .filter((presence) => !presence.deleted && !presence.market_banned && _.isEmpty(presence.email))
    .map((presence) => presence.id));
  return (comments || []).filter((comment) => !comment.resolved && !comment.deleted && comment.is_sent !== false && (
    (includeIssues && comment.comment_type === ISSUE_TYPE) ||
    ([QUESTION_TYPE, SUGGEST_CHANGE_TYPE].includes(comment.comment_type) &&
      (assigned || []).includes(comment.created_by)) ||
    (comment.comment_type === QUESTION_TYPE && aiUserIds.has(comment.created_by) &&
      aiQuestionWasOpenedForExecution(comment, stageContext))
  ));
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

// The backend evaluates the comments left after a resolve. A question or suggestion only needs to
// leave no other assistance; resolving a blocker must leave neither assistance nor another blocker.
export function doesCommentResolutionRestoreStage(comment, comments, assigned, marketPresences, stageContext) {
  const currentStage = stageContext?.currentStage;
  if (currentStage?.id) {
    const isBlocking = currentStage.move_on_comment && currentStage.allows_issues;
    const isRequiresInput = currentStage.move_on_comment && !currentStage.allows_issues;
    if ((comment.comment_type === ISSUE_TYPE && !isBlocking) ||
        ([QUESTION_TYPE, SUGGEST_CHANGE_TYPE].includes(comment.comment_type) && !isRequiresInput)) {
      return false;
    }
  }
  const remainingComments = (comments || []).filter((candidate) => candidate.id !== comment.id);
  return getOpenWorkflowComments(
    remainingComments,
    assigned,
    marketPresences,
    comment.comment_type === ISSUE_TYPE,
    stageContext
  ).length === 0;
}
