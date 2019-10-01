import React, { useState } from 'react';
import { injectIntl } from 'react-intl';
import AddIcon from '@material-ui/icons/Add';
import { IconButton } from '@material-ui/core';
import useAsyncMarketContext from '../../contexts/useAsyncMarketsContext';
import MarketsList from '../../components/DecisionDialogs/MarketsList';
import Activity from '../../containers/Activity';
import MarketAdd from '../../components/DecisionDialogs/MarketAdd';

function Markets(props) {
  const { intl } = props;
  const { marketDetails, loading } = useAsyncMarketContext();
  const [addMode, setAddMode] = useState(false);

  function toggleAdd() {
    setAddMode(!addMode);
  }

  function onMarketSave() {
    toggleAdd();
  }

  return (
    <Activity
      title={intl.formatMessage({ id: 'sidebarNavDialogs' })}
      isLoading={loading}
      titleButtons={<IconButton onClick={toggleAdd}><AddIcon /></IconButton>}
    >
      <div>
      {!addMode && <MarketsList markets={marketDetails} /> }
      {addMode && <MarketAdd onCancel={toggleAdd} onSave={onMarketSave} />}
      </div>
    </Activity>
  );
}

export default injectIntl(Markets);