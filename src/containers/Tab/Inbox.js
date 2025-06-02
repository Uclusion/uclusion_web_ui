import React from 'react';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import { useGmailTabsStyles, useGmailTabItemStyles } from '@mui-treasury/styles/tabs/gmail';
import { Tooltip, useMediaQuery, useTheme } from '@material-ui/core';
import { useIntl } from 'react-intl';

export function GmailTabItem(props) {
  const { color='#797FF2', label, tag, tagLabel = 'total', tagColor='#797FF2', toolTipId,
    ...other } = props;
  const theme = useTheme();
  const intl = useIntl();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const tabItemStyles = useGmailTabItemStyles({ ...props, color });
  const useLabel = mobileLayout ? '' : (toolTipId ? <Tooltip
    title={intl.formatMessage({ id: toolTipId })}><div>{label}</div></Tooltip> : label);
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
          borderRadius: 22, paddingLeft: '5px', paddingRight: '5px', marginLeft: mobileLayout ? '-8px' : undefined}}>
          {tag} {tagLabel}</span>}
        </div>
      }
    />
  );
}

export function GmailTabs(props) {
  const tabsStyles = useGmailTabsStyles({ ...props });
  const tabsProps = {...props};
  const { removeBoxShadow, addPaddingLeft, useColor } = props;
  delete tabsProps.indicatorColors;
  return (
    <Tabs
      {...tabsProps}
      classes={tabsStyles}
      style={{boxShadow: removeBoxShadow ? 'unset' : undefined, paddingLeft: addPaddingLeft,
        backgroundColor: useColor ? '#EDF7F8' : undefined }}
      TabIndicatorProps={{
        ...props.TabIndicatorProps,
        children: <div className={`MuiIndicator-${props.value}`} />,
      }}
    />
  );
}