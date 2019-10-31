import React, { useContext } from 'react';
import { injectIntl } from 'react-intl';

import SidebarMarketsList from '../../components/DecisionDialogs/SidebarMarketsList';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { getMarketDetailsForType } from '../../contexts/MarketsContext/marketsContextHelper';

function SidebarDecisions(props) {
  const { intl, hidden, marketType } = props;
  const [marketsState] = useContext(MarketsContext);
  const marketDetails = getMarketDetailsForType(marketsState);
  return (
    <SidebarMarketsList markets={marketDetails}/>
  );
}

export default injectIntl(SidebarDecisions);
