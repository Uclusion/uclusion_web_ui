import { STORIES_SUB_TYPE } from '../../../../../constants/markets'
import { createPlanning } from '../../../../../api/markets'
import { addMarketToStorage } from '../../../../../contexts/MarketsContext/marketsContextHelper'
import { pushMessage } from '../../../../../utils/MessageBusUtils'
import { PUSH_STAGE_CHANNEL, VERSIONS_EVENT } from '../../../../../contexts/VersionsContext/versionsContextHelper'
import { addPresenceToMarket } from '../../../../../contexts/MarketPresencesContext/marketPresencesHelper'
import _ from 'lodash'
import { processTextAndFilesForSave } from '../../../../../api/files'
import { addPlanningInvestible, stageChangeInvestible } from '../../../../../api/investibles'
import { addInvestible } from '../../../../../contexts/InvestibesContext/investiblesContextHelper'
import { saveComment } from '../../../../../api/comments'
import { REPORT_TYPE } from '../../../../../constants/comments'
import { addCommentToMarket } from '../../../../../contexts/CommentsContext/commentsContextHelper'
import { resetValues } from '../../../onboardingReducer'

/**
 * Creates the story workspace from the formdata and does all the magic to make the
 * wizard up date appropriately.
 * @param dispatchers
 * @param formData
 * @param updateFormData
 * @param intl
 * @param setOperationStatus
 */
export function doCreateStoryWorkspace(dispatchers, formData, updateFormData, intl, setOperationStatus) {
  const { meetingName } = formData;
  const {
    marketsDispatch,
    diffDispatch,
    presenceDispatch,
    investiblesDispatch,
    commentsState,
    commentsDispatch,
    versionsDispatch
  } = dispatchers;
  const isOnboarding = window.location.href.includes('onboarding');
  const homeContent = `<p>${intl.formatMessage({ id: 'WorkspaceWizardWorkspaceDescription' }, { meetingName })}</p>`;
  const onboardingContent = `${homeContent}<p>Use the <img src="https://www.uclusion.com/onboardingImages/pencil.png">in this Workspace's upper right to edit this description and replace the content below with your own.</p><p><br></p><h2>Want to collaborate with the founders?</h2><p><br></p><p>Choose <em>Support</em> from the drop down in the upper right hand corner with your name:</p><p><img src="https://www.uclusion.com/onboardingImages/dropDown.png"></p><p>And then</p><p><img src="https://www.uclusion.com/onboardingImages/supportHelp.png"></p><p><br></p><p>Also the notifications icon above <img src="https://www.uclusion.com/onboardingImages/jar.png"> always shows you what next needs your attention. If you click it now it will take you to notification preferences where you can set up Slack integration or change your email settings.</p>`;
  const descriptionContent = isOnboarding ? onboardingContent : homeContent;
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
  let createdMarketToken;
  createPlanning(marketInfo)
    .then((marketDetails) => {
      const {
        market,
        presence,
        stages,
      } = marketDetails;
      createdMarketId = market.id;
      createdMarketToken = market.invite_capability;
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
        const addInfo = {
          marketId: createdMarketId,
          name: nextStoryName,
          description: processed.text,
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
      const addInfo = {
        marketId: createdMarketId,
        name: currentStoryName,
        description: processed.text,
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
        addCommentToMarket(addedComment, commentsState, commentsDispatch, versionsDispatch);
      }
      updateFormData(resetValues()); //zero out form data since it's useless, and we want the state to be cleared
    })
    .then(() => {
      setOperationStatus({ workspaceCreated: true, marketId: createdMarketId, marketToken: createdMarketToken });
    })
    .catch(() => {
      setOperationStatus({started: false, workspaceError: true});
    });
}