import { processTextAndFilesForSave } from '../../../../api/files';
import { REQUIREMENTS_SUB_TYPE } from '../../../../constants/markets';
import { createPlanning } from '../../../../api/markets';
import { addMarketToStorage } from '../../../../contexts/MarketsContext/marketsContextHelper';
import { pushMessage } from '../../../../utils/MessageBusUtils';
import { PUSH_STAGE_CHANNEL, VERSIONS_EVENT } from '../../../../contexts/VersionsContext/versionsContextHelper';
import { addPresenceToMarket } from '../../../../contexts/MarketPresencesContext/marketPresencesHelper';

export function doCreateRequirementsWorkspace (dispatchers, formData, updateFormData) {
  const {
    workspaceName,
    workspaceDescription,
    workspaceDescriptionUploadedFiles,
  } = formData;
  const {
    marketsDispatch,
    diffDispatch,
    presenceDispatch,

  } = dispatchers;
  const processed = processTextAndFilesForSave(workspaceDescriptionUploadedFiles, workspaceDescription);
  const marketInfo = {
    name: workspaceName,
    description: processed.text,
    uploaded_files: processed.uploadedFiles,
    market_sub_type: REQUIREMENTS_SUB_TYPE,
  };
  let createdMarketId;
  return createPlanning(marketInfo)
    .then((marketDetails) => {
      const {
        market,
        presence,
        stages
      } = marketDetails;
      createdMarketId = market.id;
      addMarketToStorage(marketsDispatch, diffDispatch, market);
      pushMessage(PUSH_STAGE_CHANNEL, { event: VERSIONS_EVENT, marketId: createdMarketId, stages });
      addPresenceToMarket(presenceDispatch, createdMarketId, presence);
      return marketDetails;
    });
}