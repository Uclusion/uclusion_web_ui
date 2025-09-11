import _ from 'lodash'
import React from 'react'
import { navigate, preventDefaultAndProp } from '../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import { Menu, MenuItem, Sidebar as ProSidebar, SubMenu } from 'react-pro-sidebar'
import { IconButton, Tooltip, Typography } from '@material-ui/core';
import Link from '@material-ui/core/Link';
import { ExpandLess, ExpandMore } from '@material-ui/icons'
import { useIntl } from 'react-intl'
import { getPageReducerPage, usePageStateReducer } from '../PageState/pageStateHooks'
import { hideShowExpandIcon } from '../../utils/windowUtils'
import { PLANNING_TYPE } from '../../constants/markets'
import { ACTION_BUTTON_COLOR } from '../Buttons/ButtonConstants'
import AddIcon from '@material-ui/icons/Add'

function processRegularItem(properties) {
  const {history, text, target, num, Icon, iconColor='black', onClickFunc, isBold, isBlue, complexIcon,
    index, openMenuItems, isSubMenu, onEnterFunc, onLeaveFunc, endIcon: EndIcon, linkHref, resetFunction, tipText, idPrepend='', 
    numSuffix=''} = properties;
  if (!text) {
    return React.Fragment
  }
  const textNoSpaces = text.split(' ').join('');
  if (!target && !onClickFunc) {
    if (tipText) {
      return (
        <Tooltip key={`tip${textNoSpaces}`}
                 title={tipText}>
          <span style={{paddingLeft: '3.25rem'}}>{text}</span>
        </Tooltip>
      );
    }
    if (linkHref) {
      return (
        <span style={{paddingLeft: '1.5rem', fontWeight: 'bold'}}>
          <Link href={linkHref} target="_blank">{text}</Link>
        </span>
      );
    }
    return (
      <span style={{paddingLeft: '3.25rem'}}>{text}</span>
    );
  }
  const key = `${index}${textNoSpaces}`;
  const isLink = isBold && !isBlue;
  const backgroundColor = isBold && !isSubMenu && isBlue ? '#e0e0e0' : undefined;
  const textRepresentation = isBold ? (<span
      style={{fontWeight: 'bold', textDecoration: isLink ? 'underline' : undefined, color: isLink ? '#36A2EB' : undefined}}>
            {text}</span>)
    : <span>{text}</span>;
  const useIdPrepend =  complexIcon ? idPrepend + index : idPrepend;
  return (
    <div key={`sidebarMenuHolder${key}`}>
      <MenuItem icon={complexIcon ? Icon : <Icon htmlColor={iconColor} style={{fontSize: '1rem', marginBottom: '0.15rem'}} />}
                style={{backgroundColor, borderRadius: 22, width: '97%', marginLeft: 'auto', marginRight: 'auto'}}
                rootStyles={{
                  '.css-wx7wi4': {
                    marginRight: 0,
                  },
                }}
                key={key} id={`${useIdPrepend}${textNoSpaces}`}
                suffix={num > 0 ?
                  <Typography variant='caption' style={{ fontWeight: 'bold', paddingRight: '0.25rem' }} >{num} {numSuffix}</Typography>
                  : (EndIcon ? <IconButton id={`end${useIdPrepend}${textNoSpaces}`} size="small" onClick={(event) => onClickFunc(event)}>
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
        {textRepresentation}
      </MenuItem>
      {!_.isEmpty(openMenuItems) && (
        <div style={{paddingLeft: '1rem'}} key="openMenuItems">
          {openMenuItems.map((subItem, index) => {
            const { text, target, num, icon: Icon, onClickFunc, isBold } = subItem
            return processRegularItem({history, text, target, num, Icon, onClickFunc,
              isBold, index, isSubMenu: true})
          })}
        </div>
      )}
    </div>
  );
}

export default function Sidebar(props) {
  const history = useHistory();
  const intl = useIntl();
  const { marketId, navigationOptions, idPrepend='' } = props;
  const [pageStateFull, pageDispatch] = usePageStateReducer('sidebarMenus');
  const [pageState, updatePageState] = getPageReducerPage(pageStateFull, pageDispatch, 'sidebarState',
    {viewsOpen: true});
  const { viewsOpen } = pageState;
  const { navListItemTextArray, navLowerListItemTextArray, navMenu, navLowerMenu, listOnClick } = navigationOptions || {};
  return (
    <ProSidebar width="16rem" backgroundColor="#DFF0F2">
        {navMenu}
        <Menu rootStyles={{'.ps-menu-button': {paddingLeft: '25px', height: '30px', overflow: 'hidden'}}}
          renderExpandIcon={({ open }) => open ? <ExpandLess style={{visibility: 'hidden', marginTop: '0.3rem', 
            marginRight: '1.05rem'}} />: 
          <ExpandMore style={{visibility: 'hidden', marginTop: '0.3rem', marginRight: '1.05rem'}} />}>
          <SubMenu id='views'
                  label={intl.formatMessage({ id: 'viewInGroup' })}
                  rootStyles={{
                    '.ps-menuitem-root': {
                      backgroundColor: '#DFF0F2'
                    }
                  }}
                  suffix={<div onClick={(event)=> {
                    preventDefaultAndProp(event);
                    if (marketId) {
                      navigate(history, `/wizard#type=${PLANNING_TYPE.toLowerCase()}&marketId=${marketId}`);
                    }
                  }}><Tooltip placement='top' title={intl.formatMessage({ id: 'homeAddGroup' })}>
                  <IconButton size="small" noPadding>
                  <AddIcon htmlColor={marketId ? ACTION_BUTTON_COLOR : 'disabled'} fontSize="small" />
                  </IconButton>
                </Tooltip></div>}
                  onMouseOver={hideShowExpandIcon('views', true)}
                  onMouseOut={hideShowExpandIcon('views', false)}
                  onClick={(event) => {
                    preventDefaultAndProp(event);
                    updatePageState({viewsOpen: !viewsOpen});
                  }}
                    key="views" open={viewsOpen}>
                    {navListItemTextArray?.map((navItem, topIndex) => {
                      const { text, target, num, numSuffix, icon: Icon, complexIcon, onClickFunc, isBold, isBlue, openMenuItems,
                        onEnterFunc, onLeaveFunc, endIcon, resetFunction, tipText, linkHref } = navItem;
                      return processRegularItem({history, text, target, num, numSuffix,Icon, complexIcon, onClickFunc, isBold,
                        isBlue, linkHref, index: topIndex, openMenuItems, onEnterFunc, onLeaveFunc, endIcon, resetFunction,
                        tipText, idPrepend})
                    })}
            </SubMenu>
        </Menu>
        <div style={{marginBottom: '1rem'}} />
        {!_.isEmpty(navLowerListItemTextArray) && (
          <Menu 
            rootStyles={{'.ps-menu-button': {height: 'unset', paddingLeft: '10px'}}}
            onClick={listOnClick}>
            {navLowerListItemTextArray.map((navItem, topIndex) => {
              const { text, target, num, icon: Icon, complexIcon, onClickFunc, isBold, isBlue, openMenuItems,
                onEnterFunc, onLeaveFunc, endIcon, resetFunction, tipText, linkHref } = navItem;
              return processRegularItem({history, text, target, num, Icon, complexIcon, onClickFunc, isBold,
                isBlue, linkHref, index: topIndex, openMenuItems, onEnterFunc, onLeaveFunc, endIcon, resetFunction,
                tipText, idPrepend})
            })}
          </Menu>
        )}
        <div style={{marginBottom: '0.5rem'}} />
        {navLowerMenu}
    </ProSidebar>
  );
}