import React, { useState } from 'react';
import { AppBar, Tabs, Tab, Card } from '@material-ui/core';
import { injectIntl } from 'react-intl';
import PropTypes from 'prop-types';
import TabPanel from '../../components/Tabs/TabPanel';
import InvestiblesNav from './InvestiblesNav';
import CommentBox from '../../containers/CommentBox/CommentBox';
import useAsyncCommentsContext from '../../contexts/useAsyncCommentsContext';
import HtmlRichTextEditor from '../../components/TextEditors/HtmlRichTextEditor';


function MarketNav(props) {
  const { intl, marketId, initialTab, market } = props;
  const [selectedTab, setSelectedTab] = useState(initialTab);
  const { getCachedMarketComments, getCachedCommentsHash } = useAsyncCommentsContext();

  const comments = getCachedMarketComments(marketId);
  const marketComments = comments.filter(comment => !comment.investible_id);
  const commentsHash = getCachedCommentsHash(marketId);

  const { description } = market;
  function switchTab(event, newValue) {
    setSelectedTab(newValue);
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
        <Card>
          <HtmlRichTextEditor value={description} readOnly={true}/>
          <CommentBox comments={marketComments} commentsHash={commentsHash} depth={0} />
        </Card>
      </TabPanel>
      <TabPanel index="ideas" value={selectedTab}>
        <InvestiblesNav comments={comments} commentsHash={commentsHash} marketId={marketId} />
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
