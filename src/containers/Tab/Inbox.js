import React from 'react';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import { useGmailTabsStyles, useGmailTabItemStyles } from '@mui-treasury/styles/tabs/gmail';

export function GmailTabItem(props) {
  const { color, label, subLabel, tag } = props
  const tabItemStyles = useGmailTabItemStyles({ ...props, color });
  return (
    <Tab
      disableTouchRipple
      classes={tabItemStyles}
      {...props}
      label={
        <div className={'MuiTabItem-labelGroup'}>
          <div className={'MuiTabItem-label'}>
            {label} {tag && <span className={'MuiTabItem-tag'}>{tag}</span>}
          </div>
          {subLabel && <div className={'MuiTabItem-subLabel'}>{subLabel}</div>}
        </div>
      }
    />
  );
}

export function GmailTabs(props) {
  const { mobileLayout } = props;
  //Some sort of bug is collapsing the width to zero when the tabs are hidden so kludge for now
  const myWidth = mobileLayout ? 160 : 240;
  const tabsStyles = useGmailTabsStyles({ ...props });
  return (
    <Tabs
      {...props}
      classes={tabsStyles}
      TabIndicatorProps={{
        ...props.TabIndicatorProps,
        children: <div className={`MuiIndicator-${props.value}`} style={{minWidth: `${myWidth}px`}} />,
      }}
    />
  );
}