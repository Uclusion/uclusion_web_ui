import React, { useState } from 'react';
import InvestibleEdit from './InvestibleEdit';
import InvestibleView from './InvestibleView';
import TabPanel from '../Tabs/TabPanel';

function Investible(props) {
  console.debug('Investible component being rerendered');
  const [edit, setEdit] = useState(false);
  const {
    investible, marketId, comments, commentsHash, selectedTab,
  } = props;
  const { id } = investible;
  const investibleComments = comments.filter((comment) => comment.investible_id === id);
  return (
    <TabPanel key={id} index={id} value={selectedTab}>
      {edit && (
      <InvestibleEdit
        investible={investible}
        marketId={marketId}
        editToggle={setEdit}
        onSave={setEdit}
      />
      )}
      {!edit && (
      <InvestibleView
        investible={investible}
        marketId={marketId}
        comments={investibleComments}
        editToggle={setEdit}
        commentsHash={commentsHash}
      />
      )}
    </TabPanel>
  );
}

export default Investible;
