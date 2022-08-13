import { getNameStoredState } from '../../../components/TextFields/NameField'
import React, { useContext } from 'react'
import _ from 'lodash'
import { createPlanning } from '../../../api/markets'
import { addMarketToStorage } from '../../../contexts/MarketsContext/marketsContextHelper'
import SpinningIconLabelButton from '../../../components/Buttons/SpinningIconLabelButton'
import { Clear, SettingsBackupRestore } from '@material-ui/icons'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { useIntl } from 'react-intl'
import { pushMessage } from '../../../utils/MessageBusUtils'
import { PUSH_STAGE_CHANNEL, VERSIONS_EVENT } from '../../../api/versionedFetchUtils'
import { START_TOUR, TOUR_CHANNEL } from '../../../contexts/TourContext/tourContextMessages'
import { INVITED_USER_WORKSPACE } from '../../../contexts/TourContext/tourContextHelper'
import { addPresenceToMarket } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import TokenStorageManager, { TOKEN_TYPE_MARKET } from '../../../authorization/TokenStorageManager'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'

function MarketCreateActions(props) {
  const { setOpen } = props;
  const intl = useIntl();
  const [, marketsDispatch] = useContext(MarketsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [, presenceDispatch] = useContext(MarketPresencesContext);

  function handleSave() {
    const name = getNameStoredState('newMarket');
    if (!_.isEmpty(name)) {
      const marketInfo = {
        name
      };
      return createPlanning(marketInfo)
        .then((marketDetails) => {
          const {
            market,
            presence,
            stages,
            token
          } = marketDetails;
          const createdMarketId = market.id;
          addMarketToStorage(marketsDispatch, market);
          pushMessage(PUSH_STAGE_CHANNEL, { event: VERSIONS_EVENT, stageDetails: {[createdMarketId]: stages }});
          pushMessage(TOUR_CHANNEL, { event: START_TOUR, tour: INVITED_USER_WORKSPACE });
          addPresenceToMarket(presenceDispatch, createdMarketId, presence);
          const tokenStorageManager = new TokenStorageManager();
          return tokenStorageManager.storeToken(TOKEN_TYPE_MARKET, createdMarketId, token)
            .then(() => setOperationRunning(false));
        });
    }
  }
  return (
    <>
      <SpinningIconLabelButton onClick={() => setOpen(false)} doSpin={false} icon={Clear}
                               id="marketAddCancelButton">
        {intl.formatMessage({ id: 'marketAddCancelLabel' })}
      </SpinningIconLabelButton>
      <SpinningIconLabelButton onClick={handleSave} icon={SettingsBackupRestore} id="agilePlanFormSaveButton">
        {intl.formatMessage({ id: 'agilePlanFormSaveLabel' })}
      </SpinningIconLabelButton>
    </>
  )
}

export default MarketCreateActions;