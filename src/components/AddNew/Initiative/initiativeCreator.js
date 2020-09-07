import { addMarketToStorage } from '../../../contexts/MarketsContext/marketsContextHelper'
import { pushMessage } from '../../../utils/MessageBusUtils'
import { PUSH_STAGE_CHANNEL, VERSIONS_EVENT } from '../../../contexts/VersionsContext/versionsContextHelper'
import { addPresenceToMarket } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { addDecisionInvestible } from '../../../api/investibles'
import { addInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { resetValues } from '../wizardReducer'
import { processTextAndFilesForSave } from '../../../api/files'
import { createInitiative } from '../../../api/markets'

export function createMyInitiative (dispatchers, formData, updateFormData) {
  let createdMarketId;
  const {
    diffDispatch,
    marketsDispatch,
    presenceDispatch,
    investiblesDispatch,
  } = dispatchers;
  const {
    initiativeName,
    initiativeDescription,
    initiativeDescriptionUploadedFiles,
    initiativeExpiration,
  } = formData;
  const marketInfo = {
    name: 'NA',
    description: 'NA',
    expiration_minutes: initiativeExpiration,
  };
  const realUploadedFiles = initiativeDescriptionUploadedFiles || [];
  const {
    uploadedFiles: filteredUploads,
    text: tokensRemoved,
  } = processTextAndFilesForSave(realUploadedFiles, initiativeDescription);

  return createInitiative(marketInfo)
    .then((result) => {
      const {
        market,
        presence,
        stages
      } = result;
      createdMarketId = market.id;
      const investibleDescription = tokensRemoved ? tokensRemoved : ' ';
      const investibleInfo = {
        marketId: createdMarketId,
        uploadedFiles: filteredUploads,
        description: investibleDescription,
        name: initiativeName,
      };
      addMarketToStorage(marketsDispatch, diffDispatch, market);
      pushMessage(PUSH_STAGE_CHANNEL, { event: VERSIONS_EVENT, createdMarketId, stages });
      addPresenceToMarket(presenceDispatch, createdMarketId, presence);
      return addDecisionInvestible(investibleInfo)
        .then((investible) => {
          addInvestible(investiblesDispatch, diffDispatch, investible);
          updateFormData(resetValues());
          return createdMarketId;
        });
    });
}