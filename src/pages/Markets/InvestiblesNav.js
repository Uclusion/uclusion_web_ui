import React, { useState } from 'react';
import { AppBar, Tabs, Tab } from '@material-ui/core';
import { injectIntl } from 'react-intl';
import PropTypes from 'prop-types';
import useInvestiblesContext from '../../contexts/useInvestiblesContext';

function InvestiblesNav(props) {
  const { intl, marketId, investibleId } = props;
  const { getInvestibles } = useInvestiblesContext();
  const investibles = getInvestibles(marketId);
  const startingTab = investibleId || (investibles[0] && investibles[0].id);

  const [selectedTab, setSelectedTab] = useState(startingTab);

  function switchTab(event, newValue) {
    setSelectedTab(newValue);
  }

  function getTabs() {
    return investibles.map(inv => <Tab label={inv.name} value={inv.id} key={inv.id}/>);
  }

  return (
    <AppBar position="static" color="default">
      <Tabs value={selectedTab}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            onChange={switchTab}
      >
        {getTabs()}
      </Tabs>
    </AppBar>

  );
}

InvestiblesNav.propTypes = {
  intl: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired,
  investibleId: PropTypes.string.isRequired,
};

export default injectIntl(InvestiblesNav);
