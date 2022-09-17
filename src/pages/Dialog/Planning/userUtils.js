import { getMarketInfo } from '../../../utils/userFunctions';
import _ from 'lodash'
import { getMarketComments, refreshMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper'
import { nameFromDescription } from '../../../utils/stringFunctions'
import { addPlanningInvestible } from '../../../api/investibles'
import { moveComments } from '../../../api/comments'
import { addInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { isAcceptedStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper'

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

function getSwimlaneInvestiblesForStage(userInvestibles, stage, marketId) {
  const stageId = stage.id;
  const limitInvestibles = !isAcceptedStage(stage) ? (stage || {}).allowed_investibles : undefined;
  const limitInvestiblesAge = (stage || {}).days_visible;
  let stageInvestibles = userInvestibles.filter((investible) => {
    const marketInfo = getMarketInfo(investible, marketId) || {};
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
      return Date.now() - new Date(aMarketInfo.updated_at).getTime() < limitInvestiblesAge*24*60*60*1000;
    });
  }
  return stageInvestibles;
}

export function getUserSwimlaneInvestiblesHash(userInvestibles, stages, marketId) {
  const stageInvestiblesHash = {};
  (stages || []).forEach((stage) =>{
    const stageId = stage.id;
    const stageInvestibles = getSwimlaneInvestiblesForStage(userInvestibles, stage, marketId);
    if (!_.isEmpty(stageInvestibles)) {
      stageInvestiblesHash[stageId] = stageInvestibles;
    }
  })

  return stageInvestiblesHash;
}

export function inVerifedSwimLane(inv, investibles, verifiedStage, marketId) {
  const verifiedStageSafe = verifiedStage || {};
  const verifiedStageId = verifiedStageSafe.id;
  const aMarketInfo = getMarketInfo(inv, marketId);
  const { assigned, stage: currentStageId } = (aMarketInfo || {});
  if (currentStageId !== verifiedStageId) {
    return false;
  }
  if (_.isEmpty(assigned)) {
    return false;
  }
  return assigned.some((userId) => {
    const userInvestibles = getUserInvestibles(userId, marketId, investibles, [verifiedStageId]);
    const inVerified = getSwimlaneInvestiblesForStage(userInvestibles, verifiedStageSafe, marketId);
    return (inVerified || []).some((investible) => investible.investible.id === inv.investible.id);
  });
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
  const belowPencilHolder = document.getElementById(`showEdit1${id}`);
  if (pencilIconHolder) {
    pencilIconHolder.style.display = 'block';
  }
  if (belowPencilHolder) {
    belowPencilHolder.style.paddingTop = '0';
  }
}

export function doRemoveEdit(id, hasIcon) {
  const pencilIconHolder = document.getElementById(`showEdit0${id}`);
  const belowPencilHolder = document.getElementById(`showEdit1${id}`);
  if (pencilIconHolder) {
    pencilIconHolder.style.display = 'none';
  }
  if (belowPencilHolder && !hasIcon) {
    belowPencilHolder.style.paddingTop = '0.5rem';
  }
}

export function onDropTodo(commentId, commentsState, marketId, setOperationRunning, intl, commentsDispatch, invDispatch,
  presenceId, stageId) {
  const comments = getMarketComments(commentsState, marketId) || [];
  const fromComment = comments.find((comment) => comment.id === commentId);
  if (fromComment) {
    if (setOperationRunning) {
      setOperationRunning(true);
    }
    let name = nameFromDescription(fromComment.body);
    if (!name) {
      name = intl.formatMessage({ id: `notificationLabel${fromComment.notification_type}` });
    }
    const addInfo = {
      marketId,
      name,
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
          const comments = getMarketComments(commentsState, marketId);
          const newComments = _.unionBy(movedComments, comments, 'id')
          refreshMarketComments(commentsDispatch, marketId, newComments);
          addInvestible(invDispatch, () => {}, inv);
          if (setOperationRunning) {
            setOperationRunning(false);
          }
          return investible.id;
        });
    });
  }
}
