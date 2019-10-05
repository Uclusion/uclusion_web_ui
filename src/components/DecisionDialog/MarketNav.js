import React, { useState } from 'react';
import { useHistory } from 'react-router';
import { AppBar, Tabs, Tab } from '@material-ui/core';
import { injectIntl } from 'react-intl';
import PropTypes from 'prop-types';
import AddIcon from '@material-ui/icons/Add';
import queryString from 'query-string';
import TabPanel from '../Tabs/TabPanel';
import useAsyncInvestiblesContext from '../../contexts/useAsyncInvestiblesContext';
import useAsyncCommentsContext from '../../contexts/useAsyncCommentsContext';
import MarketView from './MarketView';
import MarketEdit from './MarketEdit';
import InvestibleAdd from '../Investibles/InvestibleAdd';
import { getTabsForInvestibles } from './tabHelpers';

function MarketNav(props) {
  const history = useHistory();
  const {
    intl, marketId, market,
  } = props;
  const values = queryString.parse(history.location.hash);
  const { investible } = values;
  const [selectedTab, setSelectedTab] = useState(undefined);
  const [edit, setEdit] = useState({});
  const { comments, createCommentsHash } = useAsyncCommentsContext();
  const { getCachedInvestibles } = useAsyncInvestiblesContext();
  const investibles = getCachedInvestibles(marketId);
  const marketComments = comments[marketId] || [];
  const marketTargetedComments = marketComments.filter((comment) => !comment.investible_id);
  const commentsHash = createCommentsHash(marketComments);
  const [previousTab, setPreviousTab] = useState();

  if (investible) {
    if (selectedTab !== investible) {
      setPreviousTab(selectedTab);
      setSelectedTab(investible);
    }
  } else if (selectedTab) {
    history.push(`/dialog/${marketId}#investible=${selectedTab}`);
  } else {
    history.push(`/dialog/${marketId}#investible=context`);
  }

  function switchTab(event, newValue) {
    history.push(`/dialog/${marketId}#investible=${newValue}`);
  }

  function editToggle(id) {
    return () => setEdit({ [id]: !edit[id] });
  }

  function onAddSave(newId) {
    setSelectedTab(newId);
  }

  function cancelAdd() {
    if (previousTab) {
      history.push(`/dialog/${marketId}#investible=${previousTab}`);
    } else {
      history.push(`/dialog/${marketId}#investible=context`);
    }
  }

  const invTabs = getTabsForInvestibles(marketId, investibles,
    marketComments, commentsHash, edit, editToggle, selectedTab);

  return (
    <div>
      <AppBar position="static" color="default">
        <Tabs
          value={selectedTab}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          onChange={switchTab}
        >
          <Tab label={intl.formatMessage({ id: 'marketNavTabContextLabel' })} value="context" />
          {invTabs.tabs}
          <Tab label={intl.formatMessage({ id: 'marketNavTabAddIdeaLabel' })} icon={<AddIcon />} value="add" />
        </Tabs>
      </AppBar>
      <TabPanel index="context" value={selectedTab}>
        {edit[marketId] && (
        <MarketEdit
          market={market}
          onSave={editToggle(marketId)}
          editToggle={editToggle(marketId)}
        />
        )}
        {!edit[marketId] && (
        <MarketView
          market={market}
          comments={marketTargetedComments}
          commentsHash={commentsHash}
          editToggle={editToggle(marketId)}
        />
        )}
      </TabPanel>
      {invTabs.tabContent}
      <TabPanel index="add" value={selectedTab}>
        <InvestibleAdd marketId={marketId} onSave={onAddSave} onCancel={cancelAdd} />
      </TabPanel>
    </div>
  );
}

MarketNav.propTypes = {
  intl: PropTypes.object.isRequired,
  initialTab: PropTypes.string.isRequired,
  marketId: PropTypes.string,
};

export default injectIntl(MarketNav);
