import { addMarketToStorage } from '../../../../contexts/MarketsContext/marketsContextHelper'
import { pushMessage } from '../../../../utils/MessageBusUtils'
import { PUSH_STAGE_CHANNEL, VERSIONS_EVENT } from '../../../../contexts/VersionsContext/versionsContextHelper'
import { addPresenceToMarket } from '../../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { addDecisionInvestible } from '../../../../api/investibles'
import { addInvestible } from '../../../../contexts/InvestibesContext/investiblesContextHelper'
import { resetValues } from '../../onboardingReducer'
import { processTextAndFilesForSave } from '../../../../api/files'
import { createInitiative } from '../../../../api/markets'

export function createMyInitiative (dispatchers, formData, updateFormData, setOperationStatus) {
  let createdMarketId;
  let createdMarketToken;
  let createdInvestibleId;
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
  createInitiative(marketInfo)
    .then((result) => {
      const {
        market,
        presence,
        stages
      } = result;
      createdMarketId = market.id;
      createdMarketToken = market.invite_capability;
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
          const { investible: myInvestible } = investible;
          const { id } = myInvestible;
          createdInvestibleId = id;
          addInvestible(investiblesDispatch, diffDispatch, investible);
        });
    })
    .then(() => {
      updateFormData(resetValues());
    })
    .then(() => {
      setOperationStatus({
        initiativeCreated: true, marketId: createdMarketId, investibleId: createdInvestibleId,
        marketToken: createdMarketToken
      });
    })
    .catch(() => {
      setOperationStatus({ initiativeError: true, started: false });
    });
}