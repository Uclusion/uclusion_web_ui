import { getMarketClient } from './uclusionClient';
import { toastErrorAndThrow } from '../utils/userMessage';

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
    .catch((error) => toastErrorAndThrow(error, 'errorInvestibleUpdateFailed'));
}

export function addDecisionInvestible(addInfo) {
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

export function addPlanningInvestible(addInfo) {
  const {
    marketId,
    name,
    description,
    uploadedFiles,
    assignments
  } = addInfo;
  return getMarketClient(marketId)
    .then((client) => client.investibles.create(name, description, uploadedFiles, assignments))
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
    .catch((error) => toastErrorAndThrow(error, customError || 'errorInvestibleStageChangeFailed'));
}

export function lockInvestibleForEdit(marketId, investibleId, breakLock) {
  return getMarketClient(marketId)
    .then((client) => client.investibles.lock(investibleId, breakLock))
    .catch((error) => toastErrorAndThrow(error, 'errorEditLockFailed'));
}

export function realeaseInvestibleEditLock(marketId, investibleId) {
  return getMarketClient(marketId)
    .then((client) => client.investibles.unlock(investibleId))
    .catch((error) => toastErrorAndThrow(error, 'errorEditLockReleaseFailed'));
}

export function moveInvestibleToCurrentVoting(moveInfo) {
  return stageChangeInvestible(moveInfo, 'errorInvestibleMoveToCurrentVotingFailed');
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
      )).catch((error) => toastErrorAndThrow(error, 'errorInvestibleAddFailed'));
}
