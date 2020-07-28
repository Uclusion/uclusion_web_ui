import { createDecision } from '../../../../api/markets';
import { addMarketToStorage } from '../../../../contexts/MarketsContext/marketsContextHelper';
import { pushMessage } from '../../../../utils/MessageBusUtils';
import { PUSH_STAGE_CHANNEL, VERSIONS_EVENT } from '../../../../contexts/VersionsContext/versionsContextHelper';
import { addPresenceToMarket } from '../../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { AllSequentialMap } from '../../../../utils/PromiseUtils';
import { processTextAndFilesForSave } from '../../../../api/files';
import { addInvestibleToStage } from '../../../../api/investibles';
import { addInvestible } from '../../../../contexts/InvestibesContext/investiblesContextHelper';
import { resetValues } from '../../onboardingReducer';

export function createMyDialog (dispatchers, formData, updateFormData, setOperationStatus) {
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
    marketId,
  } = formData;
  const marketInfo = {
    name: dialogName,
    description: dialogReason,
    expiration_minutes: dialogExpiration,
  };
  let createdMarketId;
  let createdMarketToken;
  let inVotingStage;
  let createdStage;
  createDecision(marketInfo)
    .then((marketDetails) => {
      const {
        market,
        presence,
        stages,
      } = marketDetails;
      createdMarketId = market.id;
      createdMarketToken = market.invite_capability;
      addMarketToStorage(marketsDispatch, diffDispatch, market);
      pushMessage(PUSH_STAGE_CHANNEL, { event: VERSIONS_EVENT, marketId, stages });
      addPresenceToMarket(presenceDispatch, marketId, presence);
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
        const addInfo = {
          marketId: createdMarketId,
          name: optionName,
          description: processed.text,
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
    })
    .then(() => {
      setOperationStatus({ dialogCreated: true, marketId: createdMarketId, marketToken: createdMarketToken });
    })
    .catch((error) => {
      alert(error);
      setOperationStatus({ dialogError: true });
    });
}