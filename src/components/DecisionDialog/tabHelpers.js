import { Tab } from '@material-ui/core';
import React from 'react';
import Investible from '../Investibles/Investible';

export function getTabsForInvestibles(marketId, investibles, comments, commentsHash, selectedTab) {
  console.debug('Tabs being rerendered');
  const tabs = investibles.map((inv) => (
    <Tab
      label={inv.investible.name}
      value={inv.investible.id}
      key={inv.investible.id}
    />
  ));
  const tabContent = investibles.map((inv) => (
    <Investible
      key={inv.investible.id}
      investible={inv}
      marketId={marketId}
      comments={comments}
      commentsHash={commentsHash}
      selectedTab={selectedTab}
    />
  ));
  // these are parallel arrays
  return { tabs, tabContent };
}
