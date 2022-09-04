import { pushMessage, registerListener } from '../../utils/MessageBusUtils'
import {
  PUSH_GROUPS_CHANNEL,
  VERSIONS_EVENT
} from '../../api/versionedFetchUtils';
import { addGroupsToStorage, addGroupToStorage } from './marketGroupsContextHelper'
import {
  OPERATION_HUB_CHANNEL,
  START_OPERATION,
  STOP_OPERATION
} from '../OperationInProgressContext/operationInProgressMessages'
import { lockGroupForEdit } from '../../api/markets'

export const LOCK_GROUP_CHANNEL = 'LockMarketChannel';
export const LOCK_GROUP = 'LockMarket';

function beginListening(dispatch, diffDispatch) {
  registerListener(PUSH_GROUPS_CHANNEL, 'marketGroupsPushStart',  (data) => {
    const { payload: { event, groupDetails } } = data;
    switch (event) {
      case VERSIONS_EVENT:
        addGroupsToStorage(dispatch, diffDispatch, groupDetails);
        break;
      default:
        // console.debug(`Ignoring identity event ${event}`);
    }
  });
  registerListener(LOCK_GROUP_CHANNEL, 'marketsLockStart', (data) => {
    const { payload: { marketId, groupId } } = data;
    pushMessage(OPERATION_HUB_CHANNEL, { event: START_OPERATION, id: LOCK_GROUP });
    lockGroupForEdit(marketId, groupId).then((group) => {
      pushMessage(OPERATION_HUB_CHANNEL, { event: STOP_OPERATION, id: LOCK_GROUP });
      addGroupToStorage(dispatch, () => {}, marketId, group);
    });
  });
}

export default beginListening;
