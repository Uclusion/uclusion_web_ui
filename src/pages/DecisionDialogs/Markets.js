import React, { useContext, useState } from 'react';
import { injectIntl } from 'react-intl';
import AddIcon from '@material-ui/icons/Add';
import { IconButton } from '@material-ui/core';

import MarketsList from '../../components/DecisionDialogs/MarketsList';
import Activity from '../../containers/Activity';
import MarketAdd from '../../components/DecisionDialogs/MarketAdd';
import { AsyncMarketsContext } from '../../contexts/AsyncMarketContext';

function Markets(props) {
  const { intl, hidden } = props;
  const { marketDetails, loading } = useContext(AsyncMarketsContext);
  const [addMode, setAddMode] = useState(false);

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