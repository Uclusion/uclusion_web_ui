import { doCreateRequirementsWorkspace } from '../../components/AddNew/Workspace/RequirementsWorkspace/workspaceCreator';
import {
  addDecisionInvestible,
  addInvestibleToStage,
  addPlanningInvestible
} from '../../api/investibles'
import { saveComment } from '../../api/comments'
import { ISSUE_TYPE, QUESTION_TYPE, TODO_TYPE } from '../../constants/comments'
import { changeInvestibleStageOnCommentChange } from '../../utils/commentFunctions'
import {
  isBlockedStage
} from '../../contexts/MarketStagesContext/marketStagesContextHelper'
import { refreshMarketComments } from '../../contexts/CommentsContext/commentsContextHelper'
import { DECISION_TYPE, REQUIREMENTS_SUB_TYPE } from '../../constants/markets'
import { createDecision } from '../../api/markets'
import { addMarket } from '../../contexts/MarketsContext/marketsContextHelper'
import { refreshInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper'

export function createECPMarkets (dispatchers) {
  return createProjectWorkspace(dispatchers)
    .then((createdId) => {
      return createdId;
    });
}

function addStoryOne(marketId, userId, marketInvestibles) {
  const addInfo = {
    marketId,
    name: 'Invite collaborators',
    description: '<p>Invite others to this workspace to better see Uclusion features like approving stories and mentions.</p>',
    assignments: [userId],
  };
  return addPlanningInvestible(addInfo).then((addedStory) => marketInvestibles.push(addedStory));
}

function addStoryTwo(marketId, marketInvestibles) {
  const description = '<p>The Further Work stage can be used to plan stories that are not ready to be assigned.</p><p><br></p>' +
    '<p>Try moving this story to Ready for Approval. You can drag and drop or re-assign to yourself.</p>';
  const addInfo = {
    marketId,
    name: 'Plan a story',
    description,
  };
  return addPlanningInvestible(addInfo).then((addedStory) => marketInvestibles.push(addedStory));
}

function addStoryThreeAndInlineDialog(marketId, userId, blockingStage, requiresInputStage, investiblesDispatch,
  marketComments, addedMarkets, marketInvestibles) {
  const addInfo = {
    marketId,
    name: 'A question in Uclusion',
    description: '<p>This story automatically moved to Requires Input when an assignee asked a question.</p>',
    assignments: [userId],
  };
  return addPlanningInvestible(addInfo).then((addedStory) => {
    const { market_infos: marketInfos, investible } = addedStory;
    const [info] = marketInfos;
    changeInvestibleStageOnCommentChange(false, true,
      blockingStage, requiresInputStage, info, marketInfos, investible, investiblesDispatch);
    const body = '<h2>Do you prefer asking questions with options or without?</h2><p><br></p>' +
      '<p>The option in Proposed Options cannot be approved unless you promote it.</p>';
    return saveComment(marketId, investible.id, undefined, body, QUESTION_TYPE);
  }).then((comment) => {
    marketComments.push(comment);
    const addDialogInfo = {
      name: 'NA',
      market_type: DECISION_TYPE,
      description: 'NA',
      parent_comment_id: comment.id,
    };
    return createDecision(addDialogInfo).then((result) => {
      addedMarkets.push(result);
      const { market, stages, parent } = result;
      marketComments.push(parent);
      const allowsInvestment = stages.find((stage) => stage.allows_investment);
      const addInfo = {
        marketId: market.id,
        description: '<p>Options make decisions more clear.</p>',
        name: 'Questions with options',
        stageId: allowsInvestment.id,
      };
      return addInvestibleToStage(addInfo).then((addedOption) => {
        marketInvestibles.push(addedOption);
        const addInfo = {
          marketId: market.id,
          description: '<p>Promote this option if you want to approve it.</p>',
          name: 'Questions without options',
        };
        return addDecisionInvestible(addInfo).then((addedOption) => marketInvestibles.push(addedOption));
      });
    });
  });
}

function addStoryFourAndItsIssue(marketId, userId, blockingStage, requiresInputStage, investiblesDispatch,
  marketComments) {
  const addInfo = {
    marketId,
    name: 'A story that needs help',
    description: '<p>This story automatically moved to Blocked when a blocking issue comment was opened.</p>',
    assignments: [userId],
  };
  return addPlanningInvestible(addInfo).then((addedStory) => {
    const { market_infos: marketInfos, investible } = addedStory;
    const [info] = marketInfos;
    changeInvestibleStageOnCommentChange(true, false,
      blockingStage, requiresInputStage, info, marketInfos, investible, investiblesDispatch);
    const body = '<p>Only by resolving this issue can this story be moved to a different stage.</p>';
    return saveComment(marketId, investible.id, undefined, body, ISSUE_TYPE)
      .then((comment) => marketComments.push(comment));
  });
}

function addStoryFive(marketId, userId, acceptedStage, marketInvestibles) {
  const description = '<p>Only assigned can move a story to this stage. How many stories are allowed in Not Ready for Feedback is controlled by Workspace configuration.</p><p><br></p>' +
    '<p>Try moving this story to Ready for Feedback.</p>';
  const addInfo = {
    marketId,
    name: 'A story you are actively doing',
    description,
    assignments: [userId],
    stageId: acceptedStage.id
  };
  return addPlanningInvestible(addInfo).then((addedStory) => marketInvestibles.push(addedStory));
}

function addImmediateTODO(marketId, marketComments) {
  const body = '<p>Workspace TODOs are great for recording bugs.</p><p><br></p>' +
    '<p>You can click on this TODO to edit or drag and drop to assign.</p>';
  return saveComment(marketId, undefined, undefined, body, TODO_TYPE, undefined,
    undefined, 'RED').then((comment) => marketComments.push(comment));
}

function createProjectWorkspace (dispatchers) {
  const workspaceName = 'A Demonstration Project Workspace';
  const workspaceDescription = '<p><b>Welcome to Uclusion!</b> This demo workspace has pre-created items to let quickly see some of the features.</p><p><br></p>' +
  '<p>The workspace description can be used to hold ideas and requirements before they become stories.</p>';
  return doCreateRequirementsWorkspace(dispatchers,
    { workspaceName, workspaceDescription, marketSubType: REQUIREMENTS_SUB_TYPE }).then((marketDetails) => {
    const {
      market,
      presence,
      stages
    } = marketDetails;
    const marketId = market.id;
    const userId = presence.id;
    const blockingStage = stages.find((stage) => isBlockedStage(stage));
    const requiresInputStage = stages.find((stage) => (!stage.allows_issues && stage.move_on_comment));
    const acceptedStage = stages.find((stage) => stage.assignee_enter_only);
    const {
      marketsDispatch,
      investiblesDispatch,
      diffDispatch,
      commentsDispatch,
      presenceDispatch
    } = dispatchers;
    const marketComments = [];
    const marketInvestibles = [];
    const addedMarkets = [];
    const promises = [addStoryOne(marketId, userId, marketInvestibles), addStoryTwo(marketId, marketInvestibles),
      addStoryThreeAndInlineDialog(marketId, userId, blockingStage, requiresInputStage, investiblesDispatch,
        marketComments, addedMarkets, marketInvestibles), addStoryFourAndItsIssue(marketId, userId, blockingStage,
        requiresInputStage, investiblesDispatch, marketComments), addStoryFive(marketId, userId, acceptedStage,
        marketInvestibles), addImmediateTODO(marketId, marketComments)];
    return Promise.all(promises).then(() => {
      addedMarkets.forEach((result) => addMarket(result, marketsDispatch, diffDispatch, presenceDispatch));
      refreshMarketComments(commentsDispatch, marketId, marketComments);
      refreshInvestibles(investiblesDispatch, diffDispatch, marketInvestibles);
      return Promise.resolve(true);
    });
  });
}