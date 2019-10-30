import React, { useState } from 'react';
import PropTypes from 'prop-types';
import MarketEdit from '../../pages/DecisionDialog/MarketEdit';
import MarketView from '../../pages/DecisionDialog/MarketView';
import TabPanel from '../Tabs/TabPanel';

function Market(props) {
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

Market.propTypes = {
  market: PropTypes.object.isRequired,
};

export default Market;
