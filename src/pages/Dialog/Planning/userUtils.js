import { getMarketInfo } from '../../../utils/userFunctions';
import _ from 'lodash';
import { getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { nameFromDescription } from '../../../utils/stringFunctions';
import { addPlanningInvestible } from '../../../api/investibles';
import { moveComments } from '../../../api/comments';
import { addInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { isAcceptedStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { onCommentsMove } from '../../../utils/commentFunctions';

export function isInStages(investible, stages, marketId) {
  const marketInfo = getMarketInfo(investible, marketId);
  const { stage } = marketInfo;
  return !_.isEmpty(stages.find((visibleStage) => visibleStage.id === stage));
}

/**
 * Returns the investibles in the market assigned to the user
 * @param userId
 * @param marketId
 * @param investibles
 * @param visibleStages stages to filter investibles to
 * @returns {*}
 */
export function getUserInvestibles(userId, marketId, investibles, visibleStages=[]) {
  return investibles.filter((investible) => {
    const marketInfo = getMarketInfo(investible, marketId);
    const { assigned, stage } = marketInfo;
    const assignedFull = Array.isArray(assigned) ? assigned : [];
    const fullStage = visibleStages.find((visibleStage) => visibleStage.id === stage);
    return assignedFull.includes(userId) && fullStage;
  });
}

export function getUserPendingAcceptanceInvestibles(userId, marketId, investibles, visibleStages=[]) {
  return investibles.filter((investible) => {
    const marketInfo = getMarketInfo(investible, marketId);
    const { accepted, stage, assigned_by } = marketInfo;
    const fullStage = visibleStages.find((visibleStage) => visibleStage.id === stage);
    return assigned_by === userId && fullStage && _.isEmpty(accepted);
  });
}

function getUpdatedAt(updatedAt, comments) {
  let mostRecentUpdate = updatedAt;
  comments.forEach((comment) => {
    const { updated_at: commentUpdatedAt } = comment;
    const fixed = new Date(commentUpdatedAt);
    if (fixed > mostRecentUpdate) {
      mostRecentUpdate = fixed;
    }
  });
  return mostRecentUpdate;
}

function hasInProgress(investibleId, marketComments) {
  return !_.isEmpty(marketComments.find((comment) => !comment.resolved && comment.investible_id === investibleId &&
    comment.in_progress));
}

function getSwimlaneInvestiblesForStage(userInvestibles, stage, marketId, marketComments) {
  const stageId = stage.id;
  const isStartedStage = isAcceptedStage(stage);
  const limitInvestibles = !isStartedStage ? (stage || {}).allowed_investibles : undefined;
  const limitInvestiblesAge = (stage || {}).days_visible;
  let stageInvestibles = userInvestibles.filter((investible) => {
    const marketInfo = getMarketInfo(investible, marketId) || {};
    if (isStartedStage && hasInProgress(investible.investible.id, marketComments)) {
      return true;
    }
    return marketInfo.stage === stageId;
  });
  if (limitInvestibles && stageInvestibles) {
    const sortedInvestibles = stageInvestibles.sort(function(a, b) {
      const aMarketInfo = getMarketInfo(a, marketId);
      const bMarketInfo = getMarketInfo(b, marketId);
      return new Date(bMarketInfo.updated_at) - new Date(aMarketInfo.updated_at);
    });
    stageInvestibles = _.slice(sortedInvestibles, 0, limitInvestibles);
  }
  if (limitInvestiblesAge > 0 && stageInvestibles) {
    stageInvestibles = stageInvestibles.filter((investible) => {
      const aMarketInfo = getMarketInfo(investible, marketId);
      const investibleId = investible.investible.id;
      const investibleOpenComments = marketComments.filter(comment => comment.investible_id === investibleId &&
        !comment.resolved && !comment.deleted) || [];
      const investibleOverallUpdatedAt = getUpdatedAt(new Date(aMarketInfo.updated_at), investibleOpenComments);
      return Date.now() - investibleOverallUpdatedAt.getTime() < limitInvestiblesAge*24*60*60*1000;
    });
  }
  return stageInvestibles;
}

export function getUserSwimlaneInvestiblesHash(userInvestibles, stages, marketId, marketComments) {
  const stageInvestiblesHash = {};
  (stages || []).forEach((stage) =>{
    const stageId = stage.id;
    const stageInvestibles = getSwimlaneInvestiblesForStage(userInvestibles, stage, marketId, marketComments);
    if (!_.isEmpty(stageInvestibles)) {
      stageInvestiblesHash[stageId] = stageInvestibles;
    }
  })

  return stageInvestiblesHash;
}

/**
 * Gets all presence ids related to the comments <em>Including those on submarkets for the comment</em>
 * A sub market participant is considered a collaborator if they've VOTED only.
 * TODO, we should probably account for sub market comments too, but that's a bit of an edge case
 * if they haven't voted
 * @param marketPresences
 * @param comments
 * @param marketPresencesState
 */
export function getCommenterPresences(marketPresences, comments, marketPresencesState) {
  const undeduped = (comments || []).reduce((idList, comment) => {
    const thisCommentPresences = [];
    const { inline_market_id: inlineMarketId, created_by } = comment;
    const createdPresence = marketPresences.find((presence) => presence.id === created_by);
    if (createdPresence) {
      thisCommentPresences.push(createdPresence);
    }
    if (inlineMarketId) {
      // get all of the presences out of the inline market, and find the presences
      // in THIS market that correspond to the inline market presence external ids
      // (all presences are joinable on the external ID which is a unique id for the user across all markets)
      // if that's found, and they have voted in the inline market, then add this market's presence to the collaborator list
      const inlinePresences = getMarketPresences(marketPresencesState, inlineMarketId, true);
      inlinePresences.forEach((inlinePresence) => {
        const thisMarketPresence = marketPresences.find((presence) => presence.external_id === inlinePresence.external_id);
        if (thisMarketPresence && !_.isEmpty(inlinePresence.investments)) {
          thisCommentPresences.push(thisMarketPresence);
        }
      });
    }
  return idList.concat(thisCommentPresences);
  }, []);
  return _.uniqBy(undeduped, 'id');
}

export function doShowEdit(id) {
  // Note pencil doesn't display on mobile because hover events are not available
  const pencilIconHolder = document.getElementById(`showEdit0${id}`);
  if (pencilIconHolder) {
    pencilIconHolder.style.visibility = 'visible';
  }
}

export function doRemoveEdit(id) {
  const pencilIconHolder = document.getElementById(`showEdit0${id}`);
  if (pencilIconHolder) {
    pencilIconHolder.style.visibility = 'hidden';
  }
}

export function onDropTodo(commentId, commentsState, marketId, setOperationRunning, intl, commentsDispatch, invDispatch,
  presenceId, stageId, nameId, messagesState) {
  const comments = getMarketComments(commentsState, marketId) || [];
  const fromComment = comments.find((comment) => comment.id === commentId);
  if (fromComment) {
    if (setOperationRunning) {
      setOperationRunning(true);
    }
    let name = nameId ? intl.formatMessage({ id: nameId }) : nameFromDescription(fromComment.body);
    if (!name) {
      name = intl.formatMessage({ id: 'notificationLabel' });
    }
    const addInfo = {
      marketId,
      name,
      groupId: fromComment.group_id
    };
    if (stageId) {
      addInfo.stageId = stageId;
    }
    if (presenceId) {
      addInfo.assignments = [presenceId];
    }
    return addPlanningInvestible(addInfo).then((inv) => {
      const { investible } = inv;
      return moveComments(marketId, investible.id, [commentId])
        .then((movedComments) => {
          onCommentsMove([commentId], messagesState, comments, investible.id, commentsDispatch, marketId,
            movedComments);
          addInvestible(invDispatch, () => {}, inv);
          if (setOperationRunning) {
            setOperationRunning(false);
          }
          return investible.id;
        });
    });
  }
}
