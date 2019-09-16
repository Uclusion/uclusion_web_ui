import { Tab } from '@material-ui/core';
import React from 'react';
import TabPanel from '../Tabs/TabPanel';
import InvestibleEdit from '../Investibles/InvestibleEdit';
import InvestibleView from '../Investibles/InvestibleView';

export function getTabsForInvestibles(investibles, comments, commentsHash, editOpen, toggleEditMode, selectedTab) {
  const tabs = investibles.map(inv => <Tab label={inv.name} value={inv.id} key={inv.id}/>);
  const tabContent = investibles.map((inv) => {
    const { id } = inv;
    const investibleComments = comments.filter(comment => comment.investible_id === id);
    const editMode = editOpen[id];
    return (
      <TabPanel key={id} index={id} value={selectedTab}>
        {editMode && <InvestibleEdit investible={inv}
                                     editToggle={toggleEditMode(id)}
                                     onSave={toggleEditMode(id)}/>}
        {!editMode && <InvestibleView investible={inv}
                                      comments={investibleComments}
                                      editToggle={toggleEditMode(id)}
                                      commentsHash={commentsHash}/>}
      </TabPanel>
    );
  });
  // these are parallel arrays
  return { tabs, tabContent };
}