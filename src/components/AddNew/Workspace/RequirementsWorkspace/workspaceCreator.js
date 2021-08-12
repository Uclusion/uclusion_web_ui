import { processTextAndFilesForSave } from '../../../../api/files';
import { createPlanning } from '../../../../api/markets';
import { addMarketToStorage } from '../../../../contexts/MarketsContext/marketsContextHelper';
import { pushMessage } from '../../../../utils/MessageBusUtils';
import {
  PUSH_PRESENCE_CHANNEL,
  PUSH_STAGE_CHANNEL,
  VERSIONS_EVENT
} from '../../../../contexts/VersionsContext/versionsContextHelper'
import { ADD_PRESENCE } from '../../../../contexts/MarketPresencesContext/marketPresencesMessages'
import TokenStorageManager, { TOKEN_TYPE_MARKET } from '../../../../authorization/TokenStorageManager'

export function doCreateRequirementsWorkspace (marketsDispatch, formData) {
  const {
    workspaceName,
    workspaceDescription,
    workspaceDescriptionUploadedFiles,
    marketSubType,
  } = formData;
  const processed = processTextAndFilesForSave(workspaceDescriptionUploadedFiles, workspaceDescription);
  const marketInfo = {
    name: workspaceName,
    description: processed.text,
    uploaded_files: processed.uploadedFiles,
  };
  if (marketSubType) {
    marketInfo.market_sub_type = marketSubType;
  }
  let createdMarketId;
  return createPlanning(marketInfo)
    .then((marketDetails) => {
      const {
        market,
        presence,
        stages,
        token
      } = marketDetails;
      createdMarketId = market.id;
      addMarketToStorage(marketsDispatch, () => {}, market);
      pushMessage(PUSH_STAGE_CHANNEL, { event: VERSIONS_EVENT, marketId: createdMarketId, stages });
      pushMessage(PUSH_PRESENCE_CHANNEL, { event: ADD_PRESENCE, marketId: createdMarketId, presence });
      const tokenStorageManager = new TokenStorageManager();
      return tokenStorageManager.storeToken(TOKEN_TYPE_MARKET, createdMarketId, token).then(() => marketDetails);
    });
}