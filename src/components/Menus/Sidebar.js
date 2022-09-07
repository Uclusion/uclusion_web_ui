import './Sidebar.scss';
import _ from 'lodash'
import React from 'react'
import { navigate } from '../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import { Menu, MenuItem, ProSidebar, SidebarContent, SidebarHeader, SubMenu } from 'react-pro-sidebar'
import { useMediaQuery, useTheme } from '@material-ui/core'
import Chip from '@material-ui/core/Chip'

function processRegularItem (classes, history, text, target, num, Icon, onClickFunc, isBold, newPage,
  index, search, openMenuItems, isLarge) {
  if (!text) {
    return React.Fragment
  }
  const textNoSpaces = text.split(' ').join('')
  if (!target && !onClickFunc) {
    return (
      <MenuItem icon={<Icon htmlColor="darkgrey" />} key={`noOnClick${index}${textNoSpaces}`}>
        <span style={{color: "darkgrey"}}>{text}</span>
      </MenuItem>
    )
  }
  return (
    <>
      <MenuItem icon={<Icon htmlColor="black" />}
                key={`${index}${textNoSpaces}`} id={textNoSpaces}
                suffix={num > 0 ?
                  <Chip label={`${num}`} size='small' style={{
                    backgroundColor: 'white',
                    fontWeight: 'bold',
                    border: '0.5px solid grey'
                  }} /> : undefined}
                onClick={
                  (event) => {
                    if (onClickFunc) {
                      onClickFunc(event)
                    } else {
                      navigate(history, target, false, !newPage)
                    }
                  }
                }
      >
        {isBold ? (<span style={{fontWeight: 'bold', fontSize: isLarge ? '1.5rem' : undefined}}>{text}</span>)
          : <span style={{fontSize: isLarge ? '1.25rem' : undefined}}>{text}</span>}
      </MenuItem>
      {!_.isEmpty(openMenuItems) && (
        <div style={{paddingLeft: '1rem'}}>
          {openMenuItems.map((subItem, index) => {
            const { text, target, num, icon: Icon, onClickFunc, newPage, isBold } = subItem
            return processRegularItem(classes, history, text, target, num, Icon, onClickFunc,
              isBold, newPage, index, search)
          })}
        </div>
      )}
    </>
  );
}

export default function Sidebar(props) {
  const history = useHistory();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('md'));
  const { navigationOptions, search, title, classes } = props;
  const { navListItemTextArray, navMenu, listOnClick, headerItemTextArray } = navigationOptions || {};
  return (
    <ProSidebar width="16rem" style={{paddingTop: '1rem'}}>
      <SidebarHeader>
        {!_.isEmpty(headerItemTextArray) && (
          <Menu onClick={listOnClick} iconShape="circle">
            {headerItemTextArray.map((navItem, topIndex) => {
              const { text, target, num, icon: Icon, onClickFunc, subItems, isBold, newPage, openMenuItems } = navItem;
              if (subItems) {
                return (
                  <SubMenu title={text} key={`top${topIndex}${text}${title}`} onClick={onClickFunc}
                           icon={<Icon htmlColor="black" />}
                           open={mobileLayout || (!_.isEmpty(search) && num > 0) ? true : undefined}>
                    {subItems.map((subItem, index) => {
                      const { text, target, num, icon: Icon, onClickFunc, newPage } = subItem
                      return processRegularItem(classes, history, text, target, num, Icon, onClickFunc,
                        false, newPage, index, search)
                    })}
                  </SubMenu>
                );
              }
              return processRegularItem(classes, history, text, target, num, Icon, onClickFunc, isBold, newPage,
                topIndex, search, openMenuItems, true)
            })}
          </Menu>
        )}
      </SidebarHeader>
      <SidebarContent>
        {navMenu}
      {!_.isEmpty(navListItemTextArray) && (
        <Menu onClick={listOnClick} iconShape="circle">
          {navListItemTextArray.map((navItem, topIndex) => {
            const { text, target, num, icon: Icon, onClickFunc, subItems, isBold, newPage, openMenuItems } = navItem;
            if (subItems) {
              return (
                <SubMenu title={text} key={`top${topIndex}${text}${title}`} onClick={onClickFunc}
                         icon={<Icon htmlColor="black" />}
                         open={mobileLayout || (!_.isEmpty(search) && num > 0) ? true : undefined}>
                  {subItems.map((subItem, index) => {
                    const { text, target, num, icon: Icon, onClickFunc, newPage } = subItem
                    return processRegularItem(classes, history, text, target, num, Icon, onClickFunc,
                      false, newPage, index, search)
                  })}
                </SubMenu>
              );
            }
            return processRegularItem(classes, history, text, target, num, Icon, onClickFunc, isBold, newPage,
              topIndex, search, openMenuItems)
          })}
        </Menu>
      )}
      </SidebarContent>
    </ProSidebar>
  );
}