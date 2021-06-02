import { createDecision } from '../../../api/markets'
import { addMarketToStorage } from '../../../contexts/MarketsContext/marketsContextHelper'
import { pushMessage } from '../../../utils/MessageBusUtils'
import { PUSH_STAGE_CHANNEL, VERSIONS_EVENT } from '../../../contexts/VersionsContext/versionsContextHelper'
import { addPresenceToMarket } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { AllSequentialMap } from '../../../utils/PromiseUtils'
import { processTextAndFilesForSave } from '../../../api/files'
import { addDecisionInvestible } from '../../../api/investibles'
import { addInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper'

export function createMyDialog (dispatchers, formData, updateFormData) {
  const {
    marketsDispatch,
    diffDispatch,
    presenceDispatch,
    investiblesDispatch,
  } = dispatchers;
  const {
    dialogName,
    dialogReason,
    dialogOptions,
    dialogReasonUploadedFiles,
    dialogExpiration,
    addOptionsSkipped,
    allowMultipleVotes,
  } = formData;
  const marketDescription = dialogReason === undefined ? ' ' : dialogReason;
  const safeReasonUploadedFiles = dialogReasonUploadedFiles || [];
  const processed = processTextAndFilesForSave(safeReasonUploadedFiles, marketDescription);
  const marketInfo = {
    name: dialogName,
    description: processed.text,
    uploaded_files: processed.uploadedFiles,
    expiration_minutes: dialogExpiration,
  };
  if (allowMultipleVotes === 'true') {
    marketInfo.allow_multi_vote = true;
  }

  let createdMarketId;
  let inVotingStage;
  return createDecision(marketInfo)
    .then((marketDetails) => {
      const {
        market,
        presence,
        stages,
      } = marketDetails;
      createdMarketId = market.id;
      addMarketToStorage(marketsDispatch, diffDispatch, market);
      pushMessage(PUSH_STAGE_CHANNEL, { event: VERSIONS_EVENT, createdMarketId, stages });
      addPresenceToMarket(presenceDispatch, createdMarketId, presence);
      inVotingStage = stages.find((stage) => stage.allows_investment);
      if (addOptionsSkipped) {
        return Promise.resolve(true);
      }
      return AllSequentialMap(dialogOptions, (option) => {
        const {
          optionUploadedFiles,
          optionName,
          optionDescription,
          optionDoNotPromote
        } = option;
        const realUploadedFiles = optionUploadedFiles || [];
        const processed = processTextAndFilesForSave(realUploadedFiles, optionDescription);
        const processedOptionDescription = processed.text ? processed.text : ' ';
        const addInfo = {
          marketId: createdMarketId,
          name: optionName,
          description: processedOptionDescription,
          uploadedFiles: processed.uploadedFiles
        };
        if (!optionDoNotPromote) {
          addInfo.stageId = inVotingStage.id;
        }
        return addDecisionInvestible(addInfo).then((investible) => {
            addInvestible(investiblesDispatch, diffDispatch, investible);
          });
      });
    })
    .then(() => {
      return createdMarketId;
    });
}