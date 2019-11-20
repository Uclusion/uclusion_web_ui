import { getMarketClient } from './uclusionClient';
import { ERROR, sendIntlMessage } from '../utils/userMessage';

export function updateInvestible(updateInfo) {
  const {
    marketId,
    investibleId,
    name,
    description,
    uploadedFiles,
    assignments,
  } = updateInfo;
  return getMarketClient(marketId)
    .then((client) => client.investibles.update(investibleId, name,
      description, undefined, uploadedFiles, assignments))
    .catch((error) => {
      sendIntlMessage(ERROR, 'errorInvestibleUpdateFailed');
      throw error;
    });
}

export function addInvestible(addInfo) {
  const {
    marketId,
    name,
    description,
    uploadedFiles,
  } = addInfo;
  return getMarketClient(marketId)
    .then((client) => client.investibles.create(name, description, uploadedFiles));
}

export function lockInvestibleForEdit(marketId, investibleId, breakLock) {
  return getMarketClient(marketId)
    .then((client) => client.investibles.lock(investibleId, breakLock))
    .catch((error) => {
      sendIntlMessage(ERROR, 'errorEditLockFailed');
      throw error;
    });
}

export function realeaseInvestibleEditLock(marketId, investibleId) {
  return getMarketClient(marketId)
    .then((client) => client.investibles.unlock(investibleId))
    .catch((error) => {
      sendIntlMessage(ERROR, 'errorEditLockReleaseFailed');
      throw error;
    });
}

export function acceptInvestible(acceptInfo) {
  const {
    marketId,
    investibleId,
    stageInfo, // contains the current and next stage
  } = acceptInfo;
  return getMarketClient(marketId)
    .then((client) => client.investibles.stateChange(investibleId, stageInfo)).catch((error) => {
      sendIntlMessage(ERROR, 'errorInvestibleAcceptFailed');
      throw error;
    });
}

export function addInvestibleToStage(addInfo) {
  const {
    marketId,
    name,
    description,
    uploadedFiles,
    stageInfo, // contains the current and next stage like change investible stage
  } = addInfo;
  return getMarketClient(marketId)
    .then((client) => client.investibles.create(name, description, uploadedFiles)
      .then((investibleId) => client.investibles.stateChange(investibleId, stageInfo)
        .then(() => investibleId), // make the return value the same as the regular add
      )).catch((error) => {
      sendIntlMessage(ERROR, 'errorInvestibleAddFailed');
      throw error;
    });
}
