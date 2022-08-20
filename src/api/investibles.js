import { getMarketClient } from './uclusionClient'
import { toastErrorAndThrow } from '../utils/userMessage'

export function updateInvestible(updateInfo) {
  const {
    marketId,
    investibleId,
    name,
    description,
    uploadedFiles,
    assignments,
    daysEstimate,
    requiredReviewers,
    requiredApprovers,
    openForInvestment
  } = updateInfo;
  if (assignments) {
    return getMarketClient(marketId)
      .then((client) => client.investibles.updateAssignments(investibleId, assignments))
      .catch((error) => toastErrorAndThrow(error, 'errorInvestibleUpdateFailed'));
  }
  if (openForInvestment !== undefined) {
    return getMarketClient(marketId)
      .then((client) => client.investibles.updateOpenForInvestment(investibleId, openForInvestment))
      .catch((error) => toastErrorAndThrow(error, 'errorInvestibleUpdateFailed'));
  }
  return getMarketClient(marketId)
    .then((client) => client.investibles.update(investibleId, name, description, undefined, uploadedFiles,
      daysEstimate, requiredReviewers, requiredApprovers))
    .catch((error) => toastErrorAndThrow(error, 'errorInvestibleUpdateFailed'));
}

export function addressInvestible(marketId, investibleId, addressed) {
  return getMarketClient(marketId)
    .then((client) => client.investibles.follow(investibleId, addressed))
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

export function stageChangeInvestible(acceptInfo, customError) {
  const {
    marketId,
    investibleId,
    stageInfo, // contains the current and next stage
  } = acceptInfo;
  return getMarketClient(marketId)
    .then((client) => client.investibles.stateChange(investibleId, stageInfo))
    .catch((error) => {
      if (error.status !== 404) {
        toastErrorAndThrow(error, customError || 'errorInvestibleStageChangeFailed');
      } else {
        console.error('Ignoring 404 on stage change as likely double click related');
      }
    });
}

export function lockInvestibleForEdit(marketId, investibleId, breakLock) {
  return getMarketClient(marketId)
    .then((client) => client.investibles.lock(investibleId, breakLock))
    .catch((error) => toastErrorAndThrow(error, 'errorEditLockFailed'));
}

export function acceptInvestible(marketId, investibleId) {
  return getMarketClient(marketId)
    .then((client) => client.investibles.accept(investibleId))
    .catch((error) => toastErrorAndThrow(error, 'errorAcceptInvestibleFailed'));
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
