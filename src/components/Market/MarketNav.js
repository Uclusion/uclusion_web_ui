import React, { useState } from 'react';
import { AppBar, Tabs, Tab } from '@material-ui/core';
import { injectIntl } from 'react-intl';
import PropTypes from 'prop-types';
import TabPanel from '../Tabs/TabPanel';
import InvestiblesNav from './InvestiblesNav';
import useAsyncCommentsContext from '../../contexts/useAsyncCommentsContext';
import MarketView from './MarketView';
import MarketEdit from './MarketEdit';

function MarketNav(props) {
  const { intl, marketId, initialTab, market } = props;
  const [selectedTab, setSelectedTab] = useState(initialTab);
  const [edit, setEdit] = useState(false);
  const { comments, createCommentsHash } = useAsyncCommentsContext();
  console.debug(comments);
  const marketComments = comments[marketId] || [];
  const marketTargetedComments = marketComments.filter(comment => !comment.investible_id);
  console.debug(marketTargetedComments);
  const commentsHash = createCommentsHash(marketComments);

  function switchTab(event, newValue) {
    setSelectedTab(newValue);
  }

  function editToggle() {
    setEdit(!edit);
  }

  return (
    <div>
      <AppBar position="static" color="default">
        <Tabs value={selectedTab}
              indicatorColor="primary"
              textColor="primary"
              variant="scrollable"
              onChange={switchTab}
        >
          <Tab label="Context" value="context"/>
          <Tab label="Ideas" value="ideas"/>
        </Tabs>
      </AppBar>
      <TabPanel index="context" value={selectedTab}>
        {edit && <MarketEdit market={market}
                             onSave={editToggle}
                             editToggle={editToggle}/>}
        {!edit && <MarketView
          market={market}
          comments={marketTargetedComments}
          commentsHash={commentsHash}
          editToggle={editToggle}/>}

      </TabPanel>
      <TabPanel index="ideas" value={selectedTab}>
        <InvestiblesNav comments={marketComments} commentsHash={commentsHash} marketId={marketId}/>
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
