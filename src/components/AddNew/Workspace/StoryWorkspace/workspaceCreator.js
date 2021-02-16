import { createPlanning, updateStage } from '../../../../api/markets';
import { addMarketToStorage } from '../../../../contexts/MarketsContext/marketsContextHelper';
import { pushMessage } from '../../../../utils/MessageBusUtils';
import { PUSH_STAGE_CHANNEL, VERSIONS_EVENT } from '../../../../contexts/VersionsContext/versionsContextHelper';
import { addPresenceToMarket } from '../../../../contexts/MarketPresencesContext/marketPresencesHelper';
import _ from 'lodash';
import { processTextAndFilesForSave } from '../../../../api/files';
import { addPlanningInvestible, stageChangeInvestible } from '../../../../api/investibles';
import { addInvestible } from '../../../../contexts/InvestibesContext/investiblesContextHelper';
import { saveComment } from '../../../../api/comments';
import { REPORT_TYPE } from '../../../../constants/comments';
import { addCommentToMarket } from '../../../../contexts/CommentsContext/commentsContextHelper';
import { updateStagesForMarket } from '../../../../contexts/MarketStagesContext/marketStagesContextHelper';

/**
 * Creates the story workspace from the formdata and does all the magic to make the
 * wizard up date appropriately.
 * @param dispatchers
 * @param formData
 * @param updateFormData
 * @param intl
 */
export function doCreateStoryWorkspace (dispatchers, formData, updateFormData, intl) {
  const { meetingName, advancedOptionsSkipped } = formData;
  const {
    marketsDispatch,
    marketStagesDispatch,
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
  };
  // see if we have any advanced options set, and set up the basic create info
  // don't want any null values so doing this the stupid way
  if (!advancedOptionsSkipped) {
    if (formData.votesRequired) {
      marketInfo.votes_required = formData.votesRequired;
    }
    if (formData.investmentExpiration) {
      marketInfo.investment_expiration = formData.investmentExpiration;
    }
    if (formData.ticketSubCode) {
      marketInfo.ticket_sub_code = formData.ticketSubCode;
    }
  }

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
      inProgressStage = stages.find((stage) => stage.assignee_enter_only);
      const verifiedStage = stages.find((stage) => stage.appears_in_market_summary);
      // setup the allowed stories in the in progress stage if the option is set
      if (!advancedOptionsSkipped && formData.allowedInvestibles !== undefined) {
        return updateStage(createdMarketId, inProgressStage.id, formData.allowedInvestibles)
          .then((newStage) => {
            const newStages = _.unionBy([newStage], stages, 'id');
            updateStagesForMarket(marketStagesDispatch, createdMarketId, newStages);
            if (formData.showInvestiblesAge !== undefined) {
              return updateStage(createdMarketId, verifiedStage.id, undefined,
                formData.showInvestiblesAge)
                .then((newStage) => {
                  const newStages = _.unionBy([newStage], stages, 'id');
                  updateStagesForMarket(marketStagesDispatch, createdMarketId, newStages);
                  return Promise.resolve(true);
                })
            }
            return Promise.resolve(true);
          })
      }
      if (!advancedOptionsSkipped
        && (formData.showInvestiblesAge !== undefined)) {
        return updateStage(createdMarketId, verifiedStage.id, undefined, formData.showInvestiblesAge)
          .then((newStage) => {
            const newStages = _.unionBy([newStage], stages, 'id');
            updateStagesForMarket(marketStagesDispatch, createdMarketId, newStages);
            return Promise.resolve(true);
          })
      }
      return Promise.resolve(false);
    })
    .then(() => {
      //currently don't use the return value, but success is good enough here.
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
      if (!_.isEmpty(currentStoryName)) {
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
      }
      return Promise.resolve(false);
    })
    .then((investible) => {
      if (investible) {
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
      }
      return Promise.resolve(false);
    }).then((investible) => {
      if (investible) {
        addInvestible(investiblesDispatch, diffDispatch, investible);
        const { currentStoryProgress, currentStoryProgressSkipped } = formData;
        if (!_.isEmpty(currentStoryProgress) && !currentStoryProgressSkipped) {
          return saveComment(createdMarketId, investibleId, undefined, currentStoryProgress, REPORT_TYPE, [], []);
        } else {
          return Promise.resolve(false);
        }
      }
      return Promise.resolve(false);
    })
    .then((addedComment) => {
      if (addedComment) {
        addCommentToMarket(addedComment, commentsState, commentsDispatch);
      }
      return createdMarketId;
    });
}