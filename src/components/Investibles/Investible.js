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
  const { id } = investible.investible;
  const investibleComments = comments.filter((comment) => comment.investible_id === id);
  function cancelEdit() {
    setEdit(false);
  }
  return (
    <TabPanel key={id} index={id} value={selectedTab}>
      {edit && (
      <InvestibleEdit
        investible={investible}
        marketId={marketId}
        editToggle={cancelEdit}
        onSave={cancelEdit}
      />
      )}
      {!edit && (
      <InvestibleView
        investible={investible.investible}
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
