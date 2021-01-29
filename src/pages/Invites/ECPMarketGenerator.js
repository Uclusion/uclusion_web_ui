import { doCreateRequirementsWorkspace } from '../../components/AddNew/Workspace/RequirementsWorkspace/workspaceCreator';
import {
  addDecisionInvestible,
  addInvestibleToStage,
  addPlanningInvestible,
  stageChangeInvestible
} from '../../api/investibles'
import { addInvestible } from '../../contexts/InvestibesContext/investiblesContextHelper'
import { saveComment } from '../../api/comments'
import { ISSUE_TYPE, QUESTION_TYPE } from '../../constants/comments'
import { changeInvestibleStageOnCommentChange } from '../../utils/commentFunctions'
import {
  isBlockedStage
} from '../../contexts/MarketStagesContext/marketStagesContextHelper'
import { refreshMarketComments } from '../../contexts/CommentsContext/commentsContextHelper'
import { DECISION_TYPE } from '../../constants/markets'
import { createDecision } from '../../api/markets'
import { addMarket } from '../../contexts/MarketsContext/marketsContextHelper'

export function createECPMarkets (dispatchers) {
  return createProjectWorkspace(dispatchers)
    .then((createdId) => {
      return createdId;
    });
}

function createProjectWorkspace (dispatchers) {
  const workspaceName = 'A Demonstration Project Workspace';
  const workspaceDescription = '<p><b>Welcome to Uclusion!</b> This demo workspace has pre-created items to let quickly see some of the features.</p><p><br></p>' +
  '<p>The workspace description can be used to hold ideas and requirements before they become stories.</p>';
  return doCreateRequirementsWorkspace(dispatchers, { workspaceName, workspaceDescription }).then((marketDetails) => {
    const {
      market,
      presence,
      stages
    } = marketDetails;
    const marketId = market.id;
    const userId = presence.id;
    const blockingStage = stages.find((stage) => isBlockedStage(stage));
    const requiresInputStage = stages.find((stage) => (!stage.allows_issues && stage.move_on_comment));
    const readyForApprovalStage = stages.find((stage) => stage.allows_investment);
    const acceptedStage = stages.find((stage) => stage.assignee_enter_only);
    // add the story
    const addInfo = {
      marketId: marketId,
      name: 'Invite collaborators',
      description: '<p>Invite others to this workspace to better see Uclusion features like mentions.</p>',
      assignments: [userId],
    };
    const {
      marketsDispatch,
      investiblesDispatch,
      diffDispatch,
      commentsDispatch,
      presenceDispatch
    } = dispatchers;
    let rootInvestible;
    let rootMarketInfos;
    const marketComments = [];
    return addPlanningInvestible(addInfo).then((addedStory) => {
      addInvestible(investiblesDispatch, diffDispatch, addedStory);
      const description = '<p>The Further Work stage can be used to plan stories that are not ready to be assigned.</p><p><br></p>' +
        '<p>Try moving this story to Ready for Approval. You can drag and drop or re-assign to yourself.</p>';
      const addInfo = {
        marketId: marketId,
        name: 'Plan a story',
        description,
      };
      return addPlanningInvestible(addInfo);
    }).then((addedStory) => {
      addInvestible(investiblesDispatch, diffDispatch, addedStory);
      const addInfo = {
        marketId: marketId,
        name: 'A question in Uclusion',
        description: '<p>This story automatically moved to Requires Input when an assignee asked a question.</p>',
        assignments: [userId],
      };
      return addPlanningInvestible(addInfo);
    }).then((addedStory) => {
      addInvestible(investiblesDispatch, diffDispatch, addedStory);
      const { market_infos: marketInfos, investible } = addedStory;
      rootMarketInfos = marketInfos;
      rootInvestible = investible;
      const body = '<h2>Do you prefer asking questions with options or without?</h2><p><br></p>' +
        '<p>The option in Proposed Options cannot be approved unless you promote it.</p>';
      return saveComment(marketId, investible.id, undefined, body, QUESTION_TYPE);
    }).then((comment) => {
      const [info] = rootMarketInfos;
      changeInvestibleStageOnCommentChange(false, true,
        blockingStage, requiresInputStage, info, rootMarketInfos, rootInvestible, investiblesDispatch);
      refreshMarketComments(commentsDispatch, marketId, [comment]);
      const addDialogInfo = {
        name: 'NA',
        market_type: DECISION_TYPE,
        description: 'NA',
        parent_comment_id: comment.id,
      };
      return createDecision(addDialogInfo).then((result) => {
        addMarket(result, marketsDispatch, diffDispatch, presenceDispatch);
        const { market, stages, parent } = result;
        marketComments.push(parent);
        refreshMarketComments(commentsDispatch, marketId, marketComments);
        const allowsInvestment = stages.find((stage) => stage.allows_investment);
        const notAllowsInvestment = stages.find((stage) => !stage.allows_investment);
        const stageInfo = {
          stage_id: allowsInvestment.id,
          current_stage_id: notAllowsInvestment.id,
        };
        const addInfo = {
          marketId: market.id,
          description: '<p>Options make decisions more clear.</p>',
          name: 'Questions with options',
          stageInfo: stageInfo,
        };
        return addInvestibleToStage(addInfo).then((addedOption) => {
          addInvestible(investiblesDispatch, diffDispatch, addedOption);
          const addInfo = {
            marketId: market.id,
            description: '<p>Promote this option if you want to approve it.</p>',
            name: 'Questions without options',
          };
          return addDecisionInvestible(addInfo);
        });
      }).then((addedOption) => {
        addInvestible(investiblesDispatch, diffDispatch, addedOption);
        const addInfo = {
          marketId: marketId,
          name: 'A story that needs help',
          description: '<p>This story automatically moved to Blocked when a blocking issue comment was opened.</p>',
          assignments: [userId],
        };
        return addPlanningInvestible(addInfo);
      }).then((addedStory) => {
        addInvestible(investiblesDispatch, diffDispatch, addedStory);
        const { market_infos: marketInfos, investible } = addedStory;
        rootMarketInfos = marketInfos;
        rootInvestible = investible;
        const body = '<p>Only by resolving this issue can this story be moved to a different stage.</p>';
        return saveComment(marketId, investible.id, undefined, body, ISSUE_TYPE);
      }).then((comment) => {
        const [info] = rootMarketInfos;
        changeInvestibleStageOnCommentChange(true, false,
          blockingStage, requiresInputStage, info, rootMarketInfos, rootInvestible, investiblesDispatch);
        marketComments.push(comment);
        refreshMarketComments(commentsDispatch, marketId, marketComments);
        const description = '<p>Only you can move a story to this stage. How many stories are allowed in Not Ready for Feedback is controlled by Workspace configuration.</p><p><br></p>' +
          '<p>Try moving this story to Ready for Feedback.</p>';
        const addInfo = {
          marketId: marketId,
          name: 'A story you are actively doing',
          description,
          assignments: [userId],
        };
        return addPlanningInvestible(addInfo);
      }).then((addedStory) => {
        const moveInfo = {
          marketId,
          investibleId: addedStory.investible.id,
          stageInfo: {
            current_stage_id: readyForApprovalStage.id,
            stage_id: acceptedStage.id,
          },
        };
        return stageChangeInvestible(moveInfo);
      }).then((addedStory) => {
        addInvestible(investiblesDispatch, diffDispatch, addedStory);
      });
    });
  });
}