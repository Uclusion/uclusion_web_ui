import React, { useState } from 'react';
import { AppBar, Typography, Tabs, Tab } from '@material-ui/core';
import { injectIntl } from 'react-intl';
function MarketNav(props){
  const { intl } = props;
  const [ selectedTab, setSelectedTab ] = useState('context');

  return (
    <AppBar>
      <Tabs value={selectedTab} position="static" color="default">
        <Tab label="Context" value="context" />
      </Tabs>
    </AppBar>

  )


}

export default injectIntl(MarketNav);
