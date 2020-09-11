import { createDecision } from '../../../api/markets'
import { addMarketToStorage } from '../../../contexts/MarketsContext/marketsContextHelper'
import { pushMessage } from '../../../utils/MessageBusUtils'
import { PUSH_STAGE_CHANNEL, VERSIONS_EVENT } from '../../../contexts/VersionsContext/versionsContextHelper'
import { addPresenceToMarket } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { AllSequentialMap } from '../../../utils/PromiseUtils'
import { processTextAndFilesForSave } from '../../../api/files'
import { addInvestibleToStage } from '../../../api/investibles'
import { addInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { resetValues } from '../wizardReducer'

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
    dialogExpiration,
    addOptionsSkipped,
  } = formData;
  const marketDescription = dialogReason === undefined ? ' ' : dialogReason;
  const marketInfo = {
    name: dialogName,
    description: marketDescription,
    expiration_minutes: dialogExpiration,
  };
  let createdMarketId;
  let inVotingStage;
  let createdStage;
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
      createdStage = stages.find((stage) => !stage.allows_investment);
      inVotingStage = stages.find((stage) => stage.allows_investment);
      if (addOptionsSkipped) {
        return Promise.resolve(true);
      }
      return AllSequentialMap(dialogOptions, (option) => {
        const {
          optionUploadedFiles,
          optionName,
          optionDescription
        } = option;
        const realUploadedFiles = optionUploadedFiles || [];
        const processed = processTextAndFilesForSave(realUploadedFiles, optionDescription);
        const processedOptionDescription = processed.text ? processed.text : ' ';
        const addInfo = {
          marketId: createdMarketId,
          name: optionName,
          description: processedOptionDescription,
          uploadedFiles: processed.uploadedFiles,
          stageInfo: {
            current_stage_id: createdStage.id,
            stage_id: inVotingStage.id,
          },
        };
        return addInvestibleToStage(addInfo)
          .then((investible) => {
            addInvestible(investiblesDispatch, diffDispatch, investible);
          });
      });
    })
    .then(() => {
      updateFormData(resetValues());
      return createdMarketId;
    });
}