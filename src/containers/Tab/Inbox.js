import React from 'react';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import { useGmailTabsStyles, useGmailTabItemStyles } from '@mui-treasury/styles/tabs/gmail';

export function GmailTabItem(props) {
  const { color='#055099', label, subLabel, tag, tagLabel = 'total' } = props
  const tabItemStyles = useGmailTabItemStyles({ ...props, color });
  return (
    <Tab
      disableTouchRipple
      classes={tabItemStyles}
      {...props}
      id={label.replace(/[ &]/g, '')}
      label={
        <div className={'MuiTabItem-labelGroup'}>
          <div className={'MuiTabItem-label'}>
            {label} {tag && <span className={'MuiTabItem-tag'} style={{backgroundColor: '#055099',
            borderRadius: 12, padding: '2.79px'}}>
            {tag} {tagLabel}</span>}
          </div>
          {subLabel && <div className={'MuiTabItem-subLabel'}>{subLabel}</div>}
        </div>
      }
    />
  );
}

export function GmailTabs(props) {
  const tabsStyles = useGmailTabsStyles({ ...props });
  const tabsProps = {...props};
  delete tabsProps.indicatorColors;
  return (
    <Tabs
      {...tabsProps}
      classes={tabsStyles}
      TabIndicatorProps={{
        ...props.TabIndicatorProps,
        children: <div className={`MuiIndicator-${props.value}`} />,
      }}
    />
  );
}