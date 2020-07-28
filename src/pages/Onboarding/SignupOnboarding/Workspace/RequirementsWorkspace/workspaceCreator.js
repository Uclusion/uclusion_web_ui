import { processTextAndFilesForSave } from '../../../../../api/files';
import { REQUIREMENTS_SUB_TYPE } from '../../../../../constants/markets';
import { createPlanning } from '../../../../../api/markets';
import { addMarketToStorage } from '../../../../../contexts/MarketsContext/marketsContextHelper';
import { pushMessage } from '../../../../../utils/MessageBusUtils';
import { PUSH_STAGE_CHANNEL, VERSIONS_EVENT } from '../../../../../contexts/VersionsContext/versionsContextHelper';
import { addPresenceToMarket } from '../../../../../contexts/MarketPresencesContext/marketPresencesHelper';
import _ from 'lodash';
import { saveComment } from '../../../../../api/comments';
import { TODO_TYPE } from '../../../../../constants/comments';
import { addCommentToMarket } from '../../../../../contexts/CommentsContext/commentsContextHelper';
import { resetValues } from '../../../onboardingReducer';

export function doCreateRequirementsWorkspace (dispatchers, formData, updateFormData, setOperationStatus) {
  const {
    workspaceName,
    workspaceDescription,
    workspaceDescriptionUploadedFiles,
  } = formData;
  const {
    marketsDispatch,
    diffDispatch,
    presenceDispatch,
    commentsState,
    commentsDispatch,
    versionsDispatch,
  } = dispatchers;
  const processed = processTextAndFilesForSave(workspaceDescriptionUploadedFiles, workspaceDescription);
  const marketInfo = {
    name: workspaceName,
    description: processed.text,
    uploaded_files: processed.uploadedFiles,
    market_sub_type: REQUIREMENTS_SUB_TYPE,
  };
  let createdMarketId;
  let createdMarketToken;
  createPlanning(marketInfo)
    .then((marketDetails) => {
      const {
        market,
        presence,
        stages
      } = marketDetails;
      createdMarketId = market.id;
      createdMarketToken = market.invite_capability;
      addMarketToStorage(marketsDispatch, diffDispatch, market);
      pushMessage(PUSH_STAGE_CHANNEL, { event: VERSIONS_EVENT, marketId: createdMarketId, stages });
      addPresenceToMarket(presenceDispatch, createdMarketId, presence);
      const { todo, todoSkipped, todoUploadedFiles } = formData;
      if (!_.isEmpty(todo) && !todoSkipped) {
        const processed = processTextAndFilesForSave(todoUploadedFiles, todo);
        return saveComment(createdMarketId, undefined, undefined, processed.text, TODO_TYPE, processed.uploadedFiles);
      } else {
        return Promise.resolve(false);
      }
    })
    .then((addedComment) => {
      if (addedComment) {
        addCommentToMarket(addedComment, commentsState, commentsDispatch, versionsDispatch);
      }
      return updateFormData(resetValues()); //zero out form data since it's useless, and we want the state to be cleared
    }).then(() => {
      setOperationStatus({ workspaceCreated: true, marketId: createdMarketId, marketToken: createdMarketToken });
    })
    .catch(() => {
      setOperationStatus({ started: false, workspaceError: true });
    });
}