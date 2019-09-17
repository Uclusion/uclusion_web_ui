import React, { useState } from 'react';
import { AppBar, Tabs, Tab } from '@material-ui/core';
import { injectIntl } from 'react-intl';
import PropTypes from 'prop-types';
import TabPanel from '../Tabs/TabPanel';
import useAsyncInvestiblesContext from '../../contexts/useAsyncInvestiblesContext';
import useAsyncCommentsContext from '../../contexts/useAsyncCommentsContext';
import MarketView from './MarketView';
import MarketEdit from './MarketEdit';
import InvestibleAdd from '../Investibles/InvestibleAdd';
import { getTabsForInvestibles } from './tabHelpers';
import AddIcon from '@material-ui/icons/Add';

function MarketNav(props) {
  const { intl, marketId, initialTab, market } = props;
  const [selectedTab, setSelectedTab] = useState(initialTab);
  const [edit, setEdit] = useState({});
  const { comments, createCommentsHash } = useAsyncCommentsContext();
  const { getCachedInvestibles } = useAsyncInvestiblesContext();
  const investibles = getCachedInvestibles(marketId);
  const marketComments = comments[marketId] || [];
  const marketTargetedComments = marketComments.filter(comment => !comment.investible_id);
  const commentsHash = createCommentsHash(marketComments);
  const [ previousTab, setPreviousTab ] = useState();

  function switchTab(event, newValue) {
    setPreviousTab(selectedTab);
    setSelectedTab(newValue);
  }

  function editToggle(id) {
    return () => setEdit({ [id]: !edit[id] });
  }

  function onAddSave(newId) {
    setSelectedTab(newId);
  }

  function cancelAdd() {
    if (previousTab) {
      setSelectedTab(previousTab);
    } else {
      setSelectedTab('context');
    }
    setPreviousTab(undefined);
  }

  const invTabs = getTabsForInvestibles(investibles, marketComments, commentsHash, edit, editToggle, selectedTab);

  return (
    <div>
      <AppBar position="static" color="default">
        <Tabs value={selectedTab}
              indicatorColor="primary"
              textColor="primary"
              variant="scrollable"
              onChange={switchTab}
        >
          <Tab label={intl.formatMessage({ id: 'marketNavTabContextLabel' })} value="context"/>
          {invTabs.tabs}
          <Tab label={intl.formatMessage({ id: 'marketNavTabAddIdeaLabel' })} icon={<AddIcon />} value="add"/>
        </Tabs>
      </AppBar>
      <TabPanel index="context" value={selectedTab}>
        {edit[marketId] && <MarketEdit market={market}
                             onSave={editToggle(marketId)}
                             editToggle={editToggle(marketId)}/>}
        {!edit[marketId] && <MarketView
          market={market}
          comments={marketTargetedComments}
          commentsHash={commentsHash}
          editToggle={editToggle(marketId)}/>}
      </TabPanel>
      {invTabs.tabContent}
      <TabPanel index="add" value={selectedTab}>
        <InvestibleAdd marketId={marketId} onSave={onAddSave} onCancel={cancelAdd}/>
      </TabPanel>
    </div>
  );
}

MarketNav.propTypes = {
  intl: PropTypes.object.isRequired,
  initialTab: PropTypes.string.isRequired,
  marketId: PropTypes.string.isRequired,
};

export default injectIntl(MarketNav);
