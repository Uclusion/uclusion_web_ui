import { Hub } from '@aws-amplify/core';
import {
  PUSH_STAGE_CHANNEL,
  REMOVED_MARKETS_CHANNEL,
  VERSIONS_EVENT,
} from '../VersionsContext/versionsContextHelper';
import { refreshMarketStages } from './marketStagesContextHelper';
import { removeMarketsStageDetails } from './marketStagesContextReducer';

function beginListening(dispatch) {
  Hub.listen(REMOVED_MARKETS_CHANNEL, (data) => {
    const { payload: { event, message } } = data;
    switch (event) {
      case VERSIONS_EVENT:
        console.debug(`Stages context responding to updated market event ${event}`);
        dispatch(removeMarketsStageDetails(message));
        break;
      default:
        console.debug(`Ignoring identity event ${event}`);
    }
  });
  Hub.listen(PUSH_STAGE_CHANNEL, (data) => {
    const { payload: { event, message } } = data;
    switch (event) {
      case VERSIONS_EVENT: {
        console.debug(`Stages context responding to updated market event ${event}`);
        refreshMarketStages(dispatch, message);
        break;
      }
      default:
        console.debug(`Ignoring identity event ${event}`);
    }
  });
}

export default beginListening;
