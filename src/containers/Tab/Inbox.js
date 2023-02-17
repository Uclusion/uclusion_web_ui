import React from 'react';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import { useGmailTabsStyles, useGmailTabItemStyles } from '@mui-treasury/styles/tabs/gmail';
import { useMediaQuery, useTheme } from '@material-ui/core';
import { createTheme } from '@material-ui/core/styles';

export const tabTheme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
      xxl: 2000
    },
  },
});

export function GmailTabItem(props) {
  const { color='#055099', label, subLabel, tag, isInbox, tagLabel = 'total', tagColor='#055099', ...other } = props;
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const intermediateLayout = useMediaQuery(tabTheme.breakpoints.down('lg'));
  const largeLayout = useMediaQuery(tabTheme.breakpoints.up('xxl'));
  const tabItemStyles = useGmailTabItemStyles({ ...props, color });
  const useLabel = isInbox ? (mobileLayout ? '' : label) : (intermediateLayout ? '' : label);
  return (
    <Tab
      disableTouchRipple
      classes={tabItemStyles}
      {...other}
      id={label.replace(/[ &]/g, '')}
      style={{maxWidth: mobileLayout ? undefined : (largeLayout ? '16rem' : '12vw')}}
      label={
        <div className={'MuiTabItem-labelGroup'}>
          <div className={'MuiTabItem-label'}>
            {useLabel} {tag && <span className={'MuiTabItem-tag'} style={{backgroundColor: tagColor,
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