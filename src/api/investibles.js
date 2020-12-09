import { getMarketClient } from './uclusionClient'
import { toastErrorAndThrow } from '../utils/userMessage'

export function updateInvestible (updateInfo) {
  const {
    marketId,
    investibleId,
    name,
    description,
    uploadedFiles,
    assignments,
    daysEstimate,
  } = updateInfo;
  if (assignments) {
    return getMarketClient(marketId)
      .then((client) => client.investibles.updateAssignments(investibleId, assignments))
      .catch((error) => toastErrorAndThrow(error, 'errorInvestibleUpdateFailed'));
  }
  return getMarketClient(marketId)
    .then((client) => client.investibles.update(investibleId, name, description, undefined, uploadedFiles, daysEstimate))
    .catch((error) => toastErrorAndThrow(error, 'errorInvestibleUpdateFailed'));
}

export function changeLabels(marketId, investibleId, labelList) {
  return getMarketClient(marketId)
    .then((client) => client.investibles.update(investibleId, undefined, undefined, labelList))
    .catch((error) => toastErrorAndThrow(error, 'errorInvestibleUpdateFailed'));
}

export function attachFilesToInvestible(marketId, investibleId, metadatas) {
  return getMarketClient(marketId)
    .then((client) => client.investibles.addAttachments(investibleId, metadatas))
    .catch((error) => toastErrorAndThrow(error, 'errorInvestibleAttachFilesFailed'));
}

export function deleteAttachedFilesFromInvestible(marketId, investibleId, paths) {
  return getMarketClient(marketId)
    .then((client) => client.investibles.deleteAttachments(investibleId, paths))
    .catch((error) => toastErrorAndThrow(error, 'errorInvestibleRemoveAttachedFilesFailed'));
}

export function addDecisionInvestible (addInfo) {
  const {
    marketId,
    name,
    description,
    uploadedFiles,
  } = addInfo;
  return getMarketClient(marketId)
    .then((client) => client.investibles.create(name, description, uploadedFiles))
    .catch((error) => toastErrorAndThrow(error, 'errorDecisionInvestibleAddFailed'));
}

export function addPlanningInvestible (addInfo) {
  const {
    marketId,
    name,
    description,
    uploadedFiles,
    assignments,
    daysEstimate,
    labelList
  } = addInfo;
  return getMarketClient(marketId)
    .then((client) => client.investibles.create(name, description, uploadedFiles, assignments, daysEstimate, labelList))
    .catch((error) => toastErrorAndThrow(error, 'errorPlanningInvestibleAddFailed'));
}

export function stageChangeInvestible (acceptInfo, customError) {
  const {
    marketId,
    investibleId,
    stageInfo, // contains the current and next stage
  } = acceptInfo;
  return getMarketClient(marketId)
    .then((client) => client.investibles.stateChange(investibleId, stageInfo))
    .catch((error) => toastErrorAndThrow(error, customError || 'errorInvestibleStageChangeFailed'));
}

export function lockInvestibleForEdit (marketId, investibleId, breakLock) {
  return getMarketClient(marketId)
    .then((client) => client.investibles.lock(investibleId, breakLock))
    .catch((error) => toastErrorAndThrow(error, 'errorEditLockFailed'));
}

export function realeaseInvestibleEditLock (marketId, investibleId) {
  return getMarketClient(marketId)
    .then((client) => client.investibles.unlock(investibleId))
    .catch((error) => toastErrorAndThrow(error, 'errorEditLockReleaseFailed'));
}

export function moveInvestibleToCurrentVoting (moveInfo) {
  return stageChangeInvestible(moveInfo, 'errorInvestibleMoveToCurrentVotingFailed');
}

export function moveInvestibleBackToOptionPool(moveInfo) {
  return stageChangeInvestible(moveInfo, 'errorInvestibleMoveToOptionPoolFailed');
}

export function deleteInvestible (marketId, investibleId) {
  return getMarketClient(marketId)
    .then((client) => client.investibles.delete(investibleId))
    .catch((error) => toastErrorAndThrow(error, 'errorInvestibleDeleteFailed'));
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
      .then((inv) => {
        const { investible } = inv;
        const { id } = investible;
        return client.investibles.stateChange(id, stageInfo);
      })).catch((error) => toastErrorAndThrow(error, 'errorInvestibleAddFailed'));
}
