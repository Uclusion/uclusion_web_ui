import React, { useState } from 'react';
import { AppBar, Tabs, Tab } from '@material-ui/core';
import { injectIntl } from 'react-intl';
import PropTypes from 'prop-types';
import InvestibleView from '../../components/Investibles/InvestibleView';
import useAsyncInvestiblesContext from '../../contexts/useAsyncInvestiblesContext';
import TabPanel from '../../components/Tabs/TabPanel';
import _ from 'lodash';

function InvestiblesNav(props) {
  const { intl, marketId, investibleId, comments, commentsHash } = props;
  const { getCachedInvestibles } = useAsyncInvestiblesContext();
  const investibles = getCachedInvestibles(marketId);
  const startingTab = investibleId || (!_.isEmpty(investibles) && investibles[0].id);
  const [selectedTab, setSelectedTab] = useState(startingTab);

  function switchTab(event, newValue) {
    setSelectedTab(newValue);
  }

  function getTabs() {
    return investibles.map(inv => <Tab label={inv.name} value={inv.id} key={inv.id}/>);
  }

  function getTabContent() {
    return investibles.map((inv) => {
      const { id } = inv;
      const investibleComments = comments.filter(comment => comment.investible_id === id);
      return (
        <TabPanel key={id} index={id} value={selectedTab}>
          <InvestibleView investible={inv} comments={investibleComments} commentsHash={commentsHash} />
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
