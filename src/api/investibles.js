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
    requiredReviewers,
    requiredApprovers
  } = updateInfo;
  if (assignments) {
    return getMarketClient(marketId)
      .then((client) => client.investibles.updateAssignments(investibleId, assignments))
      .catch((error) => toastErrorAndThrow(error, 'errorInvestibleUpdateFailed'));
  }
  return getMarketClient(marketId)
    .then((client) => client.investibles.update(investibleId, name, description, undefined, uploadedFiles,
      daysEstimate, requiredReviewers, requiredApprovers))
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

export function addDecisionInvestible(addInfo) {
  const {
    marketId,
  } = addInfo;
  return getMarketClient(marketId)
    .then((client) => client.investibles.create(addInfo))
    .catch((error) => toastErrorAndThrow(error, 'errorDecisionInvestibleAddFailed'));
}

export function addPlanningInvestible (addInfo) {
  const { marketId } = addInfo;
  return getMarketClient(marketId)
    .then((client) => client.investibles.create(addInfo))
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
  } = addInfo;
  return getMarketClient(marketId)
    .then((client) => client.investibles.create(addInfo))
      .catch((error) => toastErrorAndThrow(error, 'errorInvestibleAddFailed'));
}
