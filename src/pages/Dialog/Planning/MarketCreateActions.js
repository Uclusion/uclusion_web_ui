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

function MarketCreateActions(props) {
  const { setOpen } = props;
  const intl = useIntl();
  const [, marketsDispatch] = useContext(MarketsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);

  function handleSave() {
    const name = getNameStoredState('newMarket');
    if (!_.isEmpty(name)) {
      const marketInfo = {
        name
      };
      return createPlanning(marketInfo)
        .then((market) => {
          addMarketToStorage(marketsDispatch, market);
          setOperationRunning(false);
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