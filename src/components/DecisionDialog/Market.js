import React, { useState } from 'react';
import PropTypes from 'prop-types';
import MarketEdit from './MarketEdit';
import MarketView from './MarketView';
import TabPanel from '../Tabs/TabPanel';

function Market(props) {
  console.debug('Investible component being rerendered');
  const [edit, setEdit] = useState(false);
  const {
    marketTargetedComments,
    commentsHash,
    market,
    selectedTab,
  } = props;

  return (
    <TabPanel index="context" value={selectedTab}>
      {edit && (
        <MarketEdit
          market={market}
          editToggle={setEdit}
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

Market.propTypes = {
  market: PropTypes.object.isRequired,
};

export default Market;
