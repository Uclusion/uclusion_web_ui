import './Sidebar.scss';
import _ from 'lodash'
import React from 'react'
import { navigate } from '../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import { Menu, MenuItem, ProSidebar, SidebarContent, SidebarHeader, SubMenu } from 'react-pro-sidebar'
import { IconButton, Tooltip, Typography, useMediaQuery, useTheme } from '@material-ui/core';

function processRegularItem(properties) {
  const {classes, history, text, target, num, Icon, iconColor='black', onClickFunc, isBold,
    index, search, openMenuItems, isLarge, isSubMenu, onEnterFunc, onLeaveFunc, endIcon: EndIcon,
    resetFunction, tipText} = properties;
  if (!text) {
    return React.Fragment
  }
  const textNoSpaces = text.split(' ').join('')
  if (!target && !onClickFunc) {
    return (
      <Tooltip key={`tip${textNoSpaces}`}
               title={tipText}>
        <span style={{fontSize: '1.2rem', paddingLeft: '0.5rem'}}>{text}</span>
      </Tooltip>
    );
  }
  const key = `${index}${textNoSpaces}`;
  const backgroundColor = isBold && !isSubMenu ? '#b4d0d8' : undefined;
  return (
    <div key={`sidebarMenuHolder${key}`}>
      <MenuItem icon={<Icon htmlColor={iconColor} />}
                style={{backgroundColor, borderRadius: 22, width: '97%',
                marginLeft: 'auto', marginRight: 'auto'}}
                key={key} id={textNoSpaces}
                suffix={num > 0 ?
                  <Typography style={{ fontWeight: 'bold', paddingRight: '0.25rem' }} >{num}</Typography>
                  : (EndIcon ? <IconButton size="small" onClick={(event) => onClickFunc(event)}>
                      <EndIcon htmlColor="black" fontSize="small" /></IconButton>
                    : undefined)}
                onClick={
                  (event) => {
                    if (EndIcon) {
                      if (resetFunction) {
                        resetFunction(event);
                      }
                    } else {
                      if (onClickFunc) {
                        onClickFunc(event)
                      } else {
                        navigate(history, target, false)
                      }
                    }
                  }
                }
                onMouseEnter={
                  (event) => {
                    if (onEnterFunc) {
                      onEnterFunc(event);
                    }
                  }
                }
                onMouseLeave={
                  (event) => {
                    if (onLeaveFunc) {
                      onLeaveFunc(event);
                    }
                  }
                }
      >
        {isBold ? (<span style={{fontWeight: 'bold', fontSize: isLarge ? '1.2rem' : undefined}}>{text}</span>)
          : <span style={{fontSize: isLarge ? '1.2rem' : undefined}}>{text}</span>}
      </MenuItem>
      {!_.isEmpty(openMenuItems) && (
        <div style={{paddingLeft: '1rem'}} key="openMenuItems">
          {openMenuItems.map((subItem, index) => {
            const { text, target, num, icon: Icon, onClickFunc, isBold } = subItem
            return processRegularItem({classes, history, text, target, num, Icon, onClickFunc,
              isBold, index, search, isSubMenu: true})
          })}
        </div>
      )}
    </div>
  );
}

export default function Sidebar(props) {
  const history = useHistory();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('md'));
  const { navigationOptions, search, title, classes } = props;
  const { navListItemTextArray, navMenu, listOnClick, headerItemTextArray } = navigationOptions || {};
  return (
    <ProSidebar width="16rem">
      <SidebarHeader>
        {!_.isEmpty(headerItemTextArray) && (
          <Menu onClick={listOnClick} iconShape="circle">
            {headerItemTextArray.map((navItem, topIndex) => {
              const { text, target, num, icon: Icon, onClickFunc, subItems, isBold, openMenuItems,
                iconColor } = navItem;
              if (subItems) {
                return (
                  <SubMenu title={text} key={`top${topIndex}${text}${title}`} onClick={onClickFunc}
                           icon={<Icon htmlColor="black" />}
                           open={mobileLayout || (!_.isEmpty(search) && num > 0) ? true : undefined}>
                    {subItems.map((subItem, index) => {
                      const { text, target, num, icon: Icon, onClickFunc } = subItem
                      return processRegularItem({classes, history, text, target, num, Icon, onClickFunc,
                        index, search, isSubMenu: true})
                    })}
                  </SubMenu>
                );
              }
              return processRegularItem({classes, history, text, target, num, Icon, iconColor, onClickFunc,
                isBold, index: topIndex, search, openMenuItems, isLarge: true})
            })}
          </Menu>
        )}
      </SidebarHeader>
      <SidebarContent>
        {navMenu}
      {!_.isEmpty(navListItemTextArray) && (
        <Menu onClick={listOnClick} iconShape="circle">
          {navListItemTextArray.map((navItem, topIndex) => {
            const { text, target, num, icon: Icon, onClickFunc, subItems, isBold, openMenuItems,
              onEnterFunc, onLeaveFunc, endIcon, resetFunction, tipText } = navItem;
            if (subItems) {
              return (
                <SubMenu title={text} key={`top${topIndex}${text}${title}`} onClick={onClickFunc}
                         icon={<Icon htmlColor="black" />}
                         open={mobileLayout || (!_.isEmpty(search) && num > 0) ? true : undefined}>
                  {subItems.map((subItem, index) => {
                    const { text, target, num, icon: Icon, onClickFunc } = subItem
                    return processRegularItem({classes, history, text, target, num, Icon, onClickFunc,
                      index, search, isSubMenu: true})
                  })}
                </SubMenu>
              );
            }
            return processRegularItem({classes, history, text, target, num, Icon, onClickFunc, isBold,
              index: topIndex, search, openMenuItems, onEnterFunc, onLeaveFunc, endIcon, resetFunction, tipText})
          })}
        </Menu>
      )}
      </SidebarContent>
    </ProSidebar>
  );
}