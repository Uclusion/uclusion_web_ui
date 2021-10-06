import { addMarketToStorage } from '../../../contexts/MarketsContext/marketsContextHelper'
import { pushMessage } from '../../../utils/MessageBusUtils'
import { PUSH_STAGE_CHANNEL, VERSIONS_EVENT } from '../../../contexts/VersionsContext/versionsContextHelper'
import { addPresenceToMarket } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { addDecisionInvestible } from '../../../api/investibles'
import { addInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { processTextAndFilesForSave } from '../../../api/files'
import { createInitiative } from '../../../api/markets'
import { editorReset } from '../../TextEditors/quillHooks'
import TokenStorageManager, { TOKEN_TYPE_MARKET } from '../../../authorization/TokenStorageManager'

export function createMyInitiative (dispatchers, formData) {
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
    isRestricted
  } = formData;
  const marketInfo = {
    name: 'NA',
    description: 'NA',
    expiration_minutes: initiativeExpiration,
  };
  if (isRestricted === 'true') {
    marketInfo.is_restricted = true;
  }
  const realUploadedFiles = initiativeDescriptionUploadedFiles || [];
  const {
    uploadedFiles: filteredUploads,
    text: tokensRemoved,
  } = processTextAndFilesForSave(realUploadedFiles, initiativeDescription);
  const { editorController } = formData;
  return createInitiative(marketInfo)
    .then((result) => {
      const {
        market,
        presence,
        stages,
        token
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
      const tokenStorageManager = new TokenStorageManager();
      return addDecisionInvestible(investibleInfo)
        .then((investible) => {
          if (editorController) {
            editorController(editorReset());
          }
          addInvestible(investiblesDispatch, diffDispatch, investible);
          return tokenStorageManager.storeToken(TOKEN_TYPE_MARKET, createdMarketId, token).then(() => {
            return {marketId: createdMarketId, investibleId: investible.investible.id};
          });
        });
    });
}