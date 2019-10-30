import React, { useContext, useState } from 'react';
import { useHistory } from 'react-router';
import { AppBar, Tabs, Tab, makeStyles } from '@material-ui/core';
import { injectIntl } from 'react-intl';
import PropTypes from 'prop-types';
import AddIcon from '@material-ui/icons/Add';
import queryString from 'query-string';
import TabPanel from '../../components/Tabs/TabPanel';
import _ from 'lodash';
import { formInvestibleLink, navigate } from '../../utils/marketIdPathFunctions';
import InvestibleAdd from '../../components/Investibles/InvestibleAdd';
import MarketPanel from './MarketPanel';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { getMarketInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper';
import { getMarketComments } from '../../contexts/CommentsContext/commentsContextHelper';
import Investible from '../../components/Investibles/Investible';

function createCommentsHash(commentsArray) {
  return _.keyBy(commentsArray, 'id');
}


function MarketNav(props) {
  console.debug('Market nav being rerendered');
  const history = useHistory();

  const { intl, market } = props;
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

  return (
    <div>
      <AppBar position="static" color="background">
        <Tabs
          value={workAroundSelected}
          indicatorColor="primary"
          variant="scrollable"
          onChange={switchTab}
        >
          <Tab label={intl.formatMessage({ id: 'marketNavTabContextLabel' })} value="context" />
          {investibles.map((inv) => {
            return (<Tab
              label={inv.investible.name}
              value={inv.investible.id}
              key={inv.investible.id} />)})}
          <Tab  label={intl.formatMessage({ id: 'marketNavTabAddIdeaLabel' })} icon={<AddIcon />} value="add" />
        </Tabs>
      </AppBar>
      <MarketPanel
        market={market}
        marketTargetedComments={marketTargetedComments}
        selectedTab={workAroundSelected}
        commentsHash={commentsHash}
      />
      {investibles.map((inv) => {
        return (<Investible
          key={inv.investible.id}
          investible={inv}
          marketId={marketId}
          comments={marketComments}
          commentsHash={commentsHash}
          selectedTab={selectedTab}
        />);
      })}
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
