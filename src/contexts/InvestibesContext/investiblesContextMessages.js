import { refreshInvestibles } from './investiblesContextHelper'
import { pushMessage, registerListener } from '../../utils/MessageBusUtils'
import {
  OPERATION_HUB_CHANNEL,
  START_OPERATION,
  STOP_OPERATION
} from '../OperationInProgressContext/operationInProgressMessages'
import { lockInvestibleForEdit } from '../../api/investibles'
import { PUSH_INVESTIBLES_CHANNEL, VERSIONS_EVENT } from '../../api/versionedFetchUtils';

export const LOCK_INVESTIBLE_CHANNEL = 'LockInvestibleChannel';
export const LOCK_INVESTIBLE = 'LockInvestible';
export const LOAD_EVENT = 'LoadEvent';

function beginListening(dispatch, diffDispatch) {
  registerListener(PUSH_INVESTIBLES_CHANNEL, 'pushInvestibleStart', (data) => {
    const { payload: { event, investibles } } = data;
    switch (event) {
      case VERSIONS_EVENT:
        return refreshInvestibles(dispatch, diffDispatch, investibles, true);
      case LOAD_EVENT:
        return refreshInvestibles(dispatch, diffDispatch, investibles, false);
      default:
        // console.debug(`Ignoring push event ${event}`);
    }
  });
  registerListener(LOCK_INVESTIBLE_CHANNEL, 'investiblesLock', (data) => {
    const { payload: { marketId, investibleId } } = data;
    pushMessage(OPERATION_HUB_CHANNEL, { event: START_OPERATION, id: LOCK_INVESTIBLE });
    lockInvestibleForEdit(marketId, investibleId).then((newInv) => {
      pushMessage(OPERATION_HUB_CHANNEL, { event: STOP_OPERATION, id: LOCK_INVESTIBLE });
      refreshInvestibles(dispatch, diffDispatch, [newInv]);
    });
  });
}

export default beginListening;