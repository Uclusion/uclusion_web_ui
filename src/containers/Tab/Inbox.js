import React from 'react';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import { useGmailTabsStyles, useGmailTabItemStyles } from '@mui-treasury/styles/tabs/gmail';
import { useMediaQuery, useTheme } from '@material-ui/core';

export function GmailTabItem(props) {
  const { color='#055099', label, tag, tagLabel = 'total', tagColor='#055099',
    ...other } = props;
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const tabItemStyles = useGmailTabItemStyles({ ...props, color });
  const useLabel = mobileLayout ? '' : label;
  return (
    <Tab
      disableTouchRipple
      classes={tabItemStyles}
      {...other}
      id={label.replace(/[ &]/g, '')}
      style={{maxWidth: '16rem', width: '12rem'}}
      label={
        <div className={'MuiTabItem-label'}>
          {useLabel} {tag && <span className={'MuiTabItem-tag'} style={{backgroundColor: tagColor,
          borderRadius: 22, paddingLeft: '5px', paddingRight: '5px'}}>
          {tag} {tagLabel}</span>}
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