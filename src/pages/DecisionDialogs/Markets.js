import React, { useContext, useState } from 'react';
import { injectIntl } from 'react-intl';
import AddIcon from '@material-ui/icons/Add';
import { IconButton } from '@material-ui/core';

import MarketsList from '../../components/DecisionDialogs/MarketsList';
import Activity from '../../containers/Activity';
import MarketAdd from '../../components/DecisionDialogs/MarketAdd';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { getMarketDetailsForType } from '../../contexts/MarketsContext/marketsContextHelper';

function Markets(props) {
  const { intl, hidden, marketType } = props;
  const [marketsState] = useContext(MarketsContext);
  const marketDetails = getMarketDetailsForType(marketsState);
  const [addMode, setAddMode] = useState(false);
  const sharedAddMode = marketType === 'PLANNING' ? true : addMode;
  const loading = false; // TODO FIX
  function toggleAdd() {
    setAddMode(!addMode);
  }

  function onMarketSave() {
    toggleAdd();
  }
  console.debug(`Dialogs page being rerendered ${loading}`);
  const titleId = marketType === 'PLANNING' ? 'sidebarNewPlanning': 'sidebarNavDialogs';
  return (
    <Activity
      title={intl.formatMessage({ id: titleId })}
      isLoading={loading}
      titleButtons={!sharedAddMode && <IconButton onClick={toggleAdd}><AddIcon /></IconButton>}
      hidden={hidden}
    >
      <div>
        {!sharedAddMode && <MarketsList markets={marketDetails} /> }
        {sharedAddMode && (
        <MarketAdd
          onCancel={toggleAdd}
          onSave={onMarketSave}
          marketType={marketType}
        />
        )}
      </div>
    </Activity>
  );
}

export default injectIntl(Markets);
