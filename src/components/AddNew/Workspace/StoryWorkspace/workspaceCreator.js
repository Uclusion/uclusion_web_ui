import { STORIES_SUB_TYPE } from '../../../../constants/markets'
import { createPlanning } from '../../../../api/markets'
import { addMarketToStorage } from '../../../../contexts/MarketsContext/marketsContextHelper'
import { pushMessage } from '../../../../utils/MessageBusUtils'
import { PUSH_STAGE_CHANNEL, VERSIONS_EVENT } from '../../../../contexts/VersionsContext/versionsContextHelper'
import { addPresenceToMarket } from '../../../../contexts/MarketPresencesContext/marketPresencesHelper'
import _ from 'lodash'
import { processTextAndFilesForSave } from '../../../../api/files'
import { addPlanningInvestible, stageChangeInvestible } from '../../../../api/investibles'
import { addInvestible } from '../../../../contexts/InvestibesContext/investiblesContextHelper'
import { saveComment } from '../../../../api/comments'
import { REPORT_TYPE } from '../../../../constants/comments'
import { addCommentToMarket } from '../../../../contexts/CommentsContext/commentsContextHelper'

/**
 * Creates the story workspace from the formdata and does all the magic to make the
 * wizard up date appropriately.
 * @param dispatchers
 * @param formData
 * @param updateFormData
 * @param intl
 */
export function doCreateStoryWorkspace(dispatchers, formData, updateFormData, intl) {
  const { meetingName } = formData;
  const {
    marketsDispatch,
    diffDispatch,
    presenceDispatch,
    investiblesDispatch,
    commentsState,
    commentsDispatch,
  } = dispatchers;

  const descriptionContent = `<p>${intl.formatMessage({ id: 'WorkspaceWizardWorkspaceDescription' }, { meetingName })}</p>`;
  const marketInfo = {
    name: meetingName,
    description: descriptionContent,
    market_sub_type: STORIES_SUB_TYPE,
  };
  let createdMarketId;
  let investibleId;
  let inProgressStage;
  let inVotingStage;
  let myUserId;
  return createPlanning(marketInfo)
    .then((marketDetails) => {
      const {
        market,
        presence,
        stages,
      } = marketDetails;
      createdMarketId = market.id;
      myUserId = presence.id;
      addMarketToStorage(marketsDispatch, diffDispatch, market);
      pushMessage(PUSH_STAGE_CHANNEL, { event: VERSIONS_EVENT, marketId: createdMarketId, stages });
      addPresenceToMarket(presenceDispatch, createdMarketId, presence);
      inVotingStage = stages.find((stage) => stage.allows_investment);
      inProgressStage = stages.find((stage) => stage.singular_only);
      // add the next story if you have it
      const { nextStoryName, nextStoryDescription, nextStoryUploadedFiles, nextStorySkipped } = formData;
      if (!_.isEmpty(nextStoryName) && !nextStorySkipped) {
        const usedUploads = nextStoryUploadedFiles || [];
        const processed = processTextAndFilesForSave(usedUploads, nextStoryDescription);
        // add the story
        const processedStoryDescription = processed.text ? processed.text : ' ';
        const addInfo = {
          marketId: createdMarketId,
          name: nextStoryName,
          description: processedStoryDescription,
          uploadedFiles: processed.uploadedFiles,
          assignments: [myUserId],
        };
        return addPlanningInvestible(addInfo);
      }
      return Promise.resolve(false);
    })
    .then((addedStory) => {
      if (addedStory) {
        addInvestible(investiblesDispatch, diffDispatch, addedStory);
      }
      const {
        currentStoryUploadedFiles,
        currentStoryName,
        currentStoryDescription,
        currentStoryEstimate,
        currentStoryProgressSkipped,
      } = formData;
      const realUploadedFiles = currentStoryUploadedFiles || [];
      const processed = processTextAndFilesForSave(realUploadedFiles, currentStoryDescription);
      const processedStoryDescription = processed.text ? processed.text : ' ';
      const addInfo = {
        marketId: createdMarketId,
        name: currentStoryName,
        description: processedStoryDescription,
        uploadedFiles: processed.uploadedFiles,
        assignments: [myUserId],
      };
      if (_.isNumber(currentStoryEstimate) && currentStoryEstimate > 0 && !currentStoryProgressSkipped) {
        addInfo.daysEstimate = currentStoryEstimate;
      }
      return addPlanningInvestible(addInfo);
    })
    .then((investible) => {
      investibleId = investible.investible.id;
      const updateInfo = {
        marketId: createdMarketId,
        investibleId,
        stageInfo: {
          current_stage_id: inVotingStage.id,
          stage_id: inProgressStage.id,
        }
      };
      return stageChangeInvestible(updateInfo);
    })
    .then((investible) => {
      addInvestible(investiblesDispatch, diffDispatch, investible);
      const { currentStoryProgress, currentStoryProgressSkipped } = formData;
      if (!_.isEmpty(currentStoryProgress) && !currentStoryProgressSkipped) {
        return saveComment(createdMarketId, investibleId, undefined, currentStoryProgress, REPORT_TYPE, []);
      } else {
        return Promise.resolve(false);
      }
    })
    .then((addedComment) => {
      if (addedComment) {
        addCommentToMarket(addedComment, commentsState, commentsDispatch);
      }
      return createdMarketId;
    });
}