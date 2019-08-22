import React, { useState } from 'react';
import { AppBar, Tabs, Tab } from '@material-ui/core';
import { injectIntl } from 'react-intl';
import PropTypes from 'prop-types';
import Investible from '../Investibles/Investible';
import useInvestiblesContext from '../../contexts/useInvestiblesContext';
import TabPanel from '../../components/Tabs/TabPanel';
import _ from 'lodash';

function InvestiblesNav(props) {
  const { intl, marketId, investibleId } = props;
  const { getInvestibles } = useInvestiblesContext();
  const investibles = getInvestibles(marketId);
  const startingTab = investibleId || (!_.isEmpty(investibles) && investibles[0].id);
  console.log(startingTab);
  const [selectedTab, setSelectedTab] = useState(startingTab);

  function switchTab(event, newValue) {
    setSelectedTab(newValue);
  }

  function getTabs() {
    return investibles.map(inv => <Tab label={inv.name} value={inv.id} key={inv.id}/>);
  }

  function getTabContent() {
    return investibles.map((inv) => {
      return (
        <TabPanel key={inv.id} index={inv.id} value={selectedTab}>
          <Investible investible={inv}/>
        </TabPanel>
      );
    });
  }

  return (
    <div>
      <AppBar position="static" color="default">
        {!_.isEmpty(investibles) && (
          <Tabs value={selectedTab}
                indicatorColor="primary"
                textColor="primary"
                variant="scrollable"
                onChange={switchTab}
          >
            {getTabs()}
          </Tabs>
        )}
      </AppBar>
      {getTabContent()}
    </div>
  );
}

InvestiblesNav.propTypes = {
  intl: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired,
  investibleId: PropTypes.string.isRequired,
};

export default injectIntl(InvestiblesNav);
