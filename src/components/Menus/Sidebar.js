import './Sidebar.scss';
import _ from 'lodash'
import SearchBox from '../Search/SearchBox'
import React from 'react'
import { navigate } from '../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import { Menu, MenuItem, ProSidebar, SidebarContent, SidebarFooter, SidebarHeader, SubMenu } from 'react-pro-sidebar'

function processRegularItem (classes, history, text, target, num, Icon, onClickFunc, isGrouped, isBold, newPage,
  index, search, showSearch, isGreyed) {
  if (!text) {
    return React.Fragment
  }
  const textNoSpaces = text.split(' ').join('')
  if (!target && !onClickFunc) {
    return (
      <MenuItem icon={<Icon htmlColor="black" />} active={!isGreyed}
                key={`noOnClick${index}${textNoSpaces}`}>
        {text}
      </MenuItem>
    )
  }
  return (
    <MenuItem icon={<Icon htmlColor="black" />} active={!isGreyed}
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
      {text}
      {num !== undefined && !_.isEmpty(search) && (
        <span style={{width: "17%"}}>{num}</span>
      )}
    </MenuItem>
  );
}

export default function Sidebar(props) {
  const history = useHistory();
  const { navigationOptions, search, title, classes } = props;
  const { navListItemTextArray, navMenu, showSearch = true, listOnClick } = navigationOptions || {};
  return (
    <ProSidebar width="14rem">
      <SidebarHeader>
        {navMenu}
      </SidebarHeader>
      <SidebarContent>
      {!_.isEmpty(navListItemTextArray) && (
        <Menu onClick={listOnClick} iconShape="circle">
          {navListItemTextArray.map((navItem, topIndex) => {
            const { text, target, num, icon: Icon, onClickFunc, subItems, isBold, newPage, isGreyed } = navItem;
            if (subItems) {
              return (
                <>
                  <MenuItem key={`top${topIndex}${text}${title}`} onClick={onClickFunc}>
                    {text}
                  </MenuItem>
                  <SubMenu>
                    {subItems.map((subItem, index) => {
                      const { text, target, num, icon: Icon, onClickFunc, newPage } = subItem
                      return processRegularItem(classes, history, text, target, num, Icon, onClickFunc,
                        true, false, newPage, index, search, showSearch, isGreyed)
                    })}
                  </SubMenu>
                </>
              );
            }
            return processRegularItem(classes, history, text, target, num, Icon, onClickFunc, false,
              isBold, newPage, topIndex, search, showSearch, isGreyed)
          })}
        </Menu>
      )}
      </SidebarContent>
      <SidebarFooter>
      {showSearch && (
        <SearchBox/>
      )}
      </SidebarFooter>
    </ProSidebar>
  );
}