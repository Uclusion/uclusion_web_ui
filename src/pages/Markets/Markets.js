import React, { useEffect, useState } from 'react';
import { injectIntl } from 'react-intl';
import useAsyncMarketContext from '../../contexts/useAsyncMarketsContext';
import MarketsList from '../../components/Markets/MarketsList';
import Activity from '../../containers/Activity';
import AddIcon from '@material-ui/icons/Add';
import { IconButton } from '@material-ui/core';
import MarketAdd from '../../components/Markets/MarketAdd';

const pollRate = 3600000; // 60 mins = 3600 seconds * 1000 for millis

function Markets(props) {

  const { intl } = props;
  const { refreshMarkets, marketDetails, loading } = useAsyncMarketContext();
  const [addMode, setAddMode] = useState(false);

  const [firstLoad, setFirstLoad] = useState(true);

  // refresh on first load of the page, and every pollRate millis thereafter

  useEffect(() => {
    if (firstLoad) {
      refreshMarkets();
      setFirstLoad(false);
    }
    const timer = setInterval(() => refreshMarkets(), pollRate);
    return () => {
      clearInterval(timer);
    };
  });

  function toggleAdd() {
    setAddMode(!addMode);
  }

  return (
    <Activity
      title={intl.formatMessage({ id: 'sidebarNavDialogs' })}
      isLoading={loading}
      titleButtons={[<IconButton onClick={toggleAdd}><AddIcon /></IconButton>]}
    >
      {!addMode && <MarketsList markets={marketDetails} /> }
      {addMode && <MarketAdd onCancel={toggleAdd} onSave={toggleAdd} />}
    </Activity>
  );
}

export default injectIntl(Markets);