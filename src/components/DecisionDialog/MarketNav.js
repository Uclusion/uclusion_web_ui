import React, { useContext, useState } from 'react';
import { useHistory } from 'react-router';
import { AppBar, Tabs, Tab } from '@material-ui/core';
import { injectIntl } from 'react-intl';
import PropTypes from 'prop-types';
import AddIcon from '@material-ui/icons/Add';
import queryString from 'query-string';
import TabPanel from '../Tabs/TabPanel';
import _ from 'lodash';
import { formInvestibleLink, navigate } from '../../utils/marketIdPathFunctions';
import InvestibleAdd from '../Investibles/InvestibleAdd';
import { getTabsForInvestibles } from './tabHelpers';
import Market from './Market';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { getMarketInvestibles} from '../../contexts/InvestibesContext/investiblesContextHelper';
import { getMarketComments } from '../../contexts/CommentsContext/commentsContextHelper';

function createCommentsHash(commentsArray){
  return _.keyBy(commentsArray, 'id');
}

function MarketNav(props) {
  console.debug('Market nav being rerendered');
  const history = useHistory();
  const {
    intl, market,
  } = props;
  const values = queryString.parse(history.location.hash);
  const marketId = market.id;
  const { investible } = values;
  const [selectedTab, setSelectedTab] = useState(undefined);
  const [commentsState] = useContext(CommentsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const investibles = getMarketInvestibles(investiblesState, marketId);
  const marketComments = getMarketComments(commentsState, marketId);
  const marketTargetedComments = marketComments.filter((comment) => !comment.investible_id);
  const commentsHash = createCommentsHash(marketComments);
  const [previousTab, setPreviousTab] = useState();


  function pushTab(tabValue) {
    if (marketId) {
      navigate(history, formInvestibleLink(marketId, tabValue));
    }
  }

  let workAroundSelected = selectedTab;
  if (investible) {
    if (selectedTab !== investible) {
      console.debug('selectedTab set causing rerendered');
      setPreviousTab(selectedTab);
      workAroundSelected = investible;
      setSelectedTab(workAroundSelected);
    }
  } else {
    console.error('Bad url rerendered');
    // Someone passed us a bad URL so fall back to context tab
    workAroundSelected = 'context';
    pushTab('context');
  }

  function switchTab(event, newValue) {
    pushTab(newValue);
  }

  function onAddSave(newId) {
    pushTab(newId);
  }

  function cancelAdd() {
    if (previousTab) {
      pushTab(previousTab);
    } else {
      pushTab('context');
    }
  }

  const invTabs = getTabsForInvestibles(marketId, investibles, marketComments, commentsHash,
    workAroundSelected);

  return (
    <div>
      <AppBar position="static" color="background">
        <Tabs
          value={workAroundSelected}
          indicatorColor="primary"
          textColor="secondary"
          variant="scrollable"
          onChange={switchTab}
        >
          <Tab label={intl.formatMessage({ id: 'marketNavTabContextLabel' })} value="context" />
          {invTabs.tabs}
          <Tab label={intl.formatMessage({ id: 'marketNavTabAddIdeaLabel' })} icon={<AddIcon />} value="add" />
        </Tabs>
      </AppBar>
      <Market
        market={market}
        marketTargetedComments={marketTargetedComments}
        selectedTab={workAroundSelected}
        commentsHash={commentsHash}
      />
      {invTabs.tabContent}
      <TabPanel index="add" value={workAroundSelected}>
        <InvestibleAdd marketId={marketId} onSave={onAddSave} onCancel={cancelAdd} />
      </TabPanel>
    </div>
  );
}

MarketNav.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  intl: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  market: PropTypes.object.isRequired,
};

export default injectIntl(React.memo(MarketNav));
