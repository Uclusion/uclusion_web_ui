import './Sidebar.scss';
import _ from 'lodash'
import React from 'react'
import { navigate } from '../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import { Menu, MenuItem, ProSidebar, SidebarContent, SidebarHeader, SubMenu } from 'react-pro-sidebar'
import { useMediaQuery, useTheme } from '@material-ui/core'

function processRegularItem (classes, history, text, target, num, Icon, onClickFunc, isBold, newPage,
  index, search, openMenuItems) {
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
        {isBold ? (<span style={{fontWeight: 'bold'}}>{text}</span>) : text}
        {num !== undefined && !_.isEmpty(search) && (
          <span style={{float: "right"}}>{num}</span>
        )}
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
  const { navListItemTextArray, navMenu, listOnClick } = navigationOptions || {};
  return (
    <ProSidebar width="14rem">
      <SidebarHeader>
        {navMenu}
      </SidebarHeader>
      <SidebarContent>
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