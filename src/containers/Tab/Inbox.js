import React, { useContext } from 'react';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import { useGmailTabsStyles, useGmailTabItemStyles } from '@mui-treasury/styles/tabs/gmail';
import { Tooltip, useMediaQuery, useTheme } from '@material-ui/core';
import { useIntl } from 'react-intl';
import { useButtonColors, COUNT_COLOR, DARK_ACTION_BUTTON_COLOR } from '../../components/Buttons/ButtonConstants';
import { ThemeModeContext } from '../../contexts/ThemeModeContext';

export function GmailTabItem(props) {
  const { color='#2F80ED', label, tag, tagLabel, hasChip=true, tagColor=COUNT_COLOR, toolTipId, icon,
    ...other } = props;
  const [themeMode] = useContext(ThemeModeContext);
  const isDark = themeMode === 'dark';
  const theme = useTheme();
  const intl = useIntl();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const tabItemStyles = useGmailTabItemStyles({ ...props, color });
  const useTagLabel = mobileLayout ? '' : (tagLabel || 'total');
  const useLabel = mobileLayout ? '' : (toolTipId ? <Tooltip
    title={intl.formatMessage({ id: toolTipId })}><div>{label}</div></Tooltip> : label);
  return (
    <Tab
      disableTouchRipple
      classes={tabItemStyles}
      {...other}
      icon={isDark ? React.cloneElement(icon, { htmlColor: DARK_ACTION_BUTTON_COLOR }) : icon}
      id={label.replace(/[ &/]/g, '')}
      style={{maxWidth: '16rem', width: '12rem'}}
      label={
        <div className={'MuiTabItem-label'} style={{color: isDark ? '#ffffff' : '#000000', opacity: 0.6}}>
          {useLabel} {tag && <span className={'MuiTabItem-tag'} style={{backgroundColor: hasChip ? tagColor : 'unset',
          color: hasChip ? undefined : 'black', borderRadius: 22, paddingLeft: '5px', paddingRight: '5px', 
          marginLeft: mobileLayout ? '-8px' : undefined}}>
          {tag} {useTagLabel}</span>}
        </div>
      }
    />
  );
}

export function GmailTabs(props) {
  const tabsStyles = useGmailTabsStyles({ ...props });
  const tabsProps = {...props};
  const { removeBoxShadow, addPaddingLeft, addMarginLeft, useColor=true } = props;
  const { lighterBlueColor } = useButtonColors();
  delete tabsProps.indicatorColors;
  delete tabsProps.useColor;
  delete tabsProps.removeBoxShadow;
  delete tabsProps.addPaddingLeft;
  delete tabsProps.addMarginLeft;
  return (
    <Tabs
      {...tabsProps}
      classes={tabsStyles}
      style={{boxShadow: removeBoxShadow ? 'unset' : undefined, paddingLeft: addPaddingLeft, marginLeft: addMarginLeft,
        backgroundColor: useColor ? lighterBlueColor : undefined }}
      TabIndicatorProps={{
        ...props.TabIndicatorProps,
        children: <div className={`MuiIndicator-${props.value}`} />,
      }}
    />
  );
}