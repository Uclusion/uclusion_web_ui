import React, { useState } from 'react';
import PropTypes from 'prop-types';
import MarketEdit from './MarketEdit';
import MarketView from './MarketView';
import TabPanel from '../../components/Tabs/TabPanel';

function MarketPanel(props) {
  console.debug('Market component being rerendered');
  const [edit, setEdit] = useState(false);
  const {
    marketTargetedComments,
    commentsHash,
    market,
    selectedTab,
  } = props;
  function cancelEdit() {
    setEdit(false);
  }
  return (
    <TabPanel index="context" value={selectedTab}>
      {edit && (
        <MarketEdit
          market={market}
          editToggle={cancelEdit}
        />
      )}
      {!edit && (
        <MarketView
          market={market}
          comments={marketTargetedComments}
          commentsHash={commentsHash}
          editToggle={setEdit}
        />
      )}
    </TabPanel>
  );
}

MarketPanel.propTypes = {
  market: PropTypes.object.isRequired,
};

export default MarketPanel;
