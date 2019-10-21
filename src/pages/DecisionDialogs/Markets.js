import React, { useContext, useState } from 'react';
import { injectIntl } from 'react-intl';
import AddIcon from '@material-ui/icons/Add';
import { IconButton } from '@material-ui/core';

import MarketsList from '../../components/DecisionDialogs/MarketsList';
import Activity from '../../containers/Activity';
import MarketAdd from '../../components/DecisionDialogs/MarketAdd';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { getAllMarketDetails } from '../../contexts/MarketsContext/marketsContextHelper';

function Markets(props) {
  const { intl, hidden } = props;
  const [marketsState] = useContext(MarketsContext);
  const marketDetails = getAllMarketDetails(marketsState);
  const [addMode, setAddMode] = useState(false);
  const loading = false; // TODO FIX
  function toggleAdd() {
    setAddMode(!addMode);
  }

  function onMarketSave() {
    toggleAdd();
  }
  console.debug(`Dialogs page being rerendered ${loading}`);
  return (
    <Activity
      title={intl.formatMessage({ id: 'sidebarNavDialogs' })}
      isLoading={loading}
      titleButtons={<IconButton onClick={toggleAdd}><AddIcon /></IconButton>}
      hidden={hidden}
    >
      <div>
      {!addMode && <MarketsList markets={marketDetails} /> }
      {addMode && <MarketAdd onCancel={toggleAdd} onSave={onMarketSave} />}
      </div>
    </Activity>
  );
}

export default injectIntl(Markets);