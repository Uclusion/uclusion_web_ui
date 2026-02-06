import _ from 'lodash'
import React, { useContext } from 'react'
import { navigate, preventDefaultAndProp } from '../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import { Menu, MenuItem, Sidebar as ProSidebar, SubMenu } from 'react-pro-sidebar'
import { IconButton, Tooltip } from '@material-ui/core';
import Link from '@material-ui/core/Link';
import { ExpandLess, ExpandMore } from '@material-ui/icons'
import { useIntl } from 'react-intl'
import { getPageReducerPage, usePageStateReducer } from '../PageState/pageStateHooks'
import { PLANNING_TYPE } from '../../constants/markets'
import { DARK_ACTION_BUTTON_COLOR, useButtonColors } from '../Buttons/ButtonConstants'
import AddIcon from '@material-ui/icons/Add'
import NotificationCountChips from '../../pages/Dialog/NotificationCountChips'
import { ThemeModeContext } from '../../contexts/ThemeModeContext'

function processRegularItem(properties) {
  const {history, text, target, num, Icon, iconColor='black', onClickFunc, isBold, isBlue, complexIcon,
    index, openMenuItems, isSubMenu, onEnterFunc, onLeaveFunc, endIcon: EndIcon, linkHref, resetFunction, tipText, idPrepend='', 
    numSuffix='', infoColor, isDark} = properties;
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
  const isActive = isBold && !isSubMenu && isBlue;
  const backgroundColor = isActive ? (isDark ? 'grey' : '#e0e0e0') : undefined;
  const textRepresentation = isBold ? (<span
      style={{fontWeight: 'bold', color: isLink ? '#2F80ED' : undefined}}>{text}</span>)
    : <span>{text}</span>;
  const useIdPrepend =  complexIcon ? idPrepend + index : idPrepend;

  return (
    <div key={`sidebarMenuHolder${key}`}>
      <MenuItem icon={complexIcon ? Icon : <Icon htmlColor={iconColor} style={{fontSize: '1rem', marginBottom: '0.15rem'}} />}
                style={{backgroundColor, borderRadius: 22}}
                rootStyles={{
                  '.css-wx7wi4': {
                    marginRight: 0,
                  },
                }}
                key={key} id={`${useIdPrepend}${textNoSpaces}`}
                suffix={num > 0 ?
                 <NotificationCountChips num={num} numSuffix={numSuffix} />
                  : (EndIcon ? <IconButton id={`end${useIdPrepend}${textNoSpaces}`} size="small" 
                    style={{transform: 'translateX(5px)'}}
                  onClick={(event) => onClickFunc(event)}>
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
        <div style={{paddingLeft: '1rem', backgroundColor: infoColor}} key="openMenuItems">
          {openMenuItems.map((subItem, index) => {
            const { text, target, num, icon: Icon, onClickFunc, isBold } = subItem
            return processRegularItem({history, text, target, num, Icon, onClickFunc,
              isBold, index, isSubMenu: true, infoColor, isDark})
          })}
        </div>
      )}
    </div>
  );
}

export default function Sidebar(props) {
  const history = useHistory();
  const intl = useIntl();
  const [themeMode] = useContext(ThemeModeContext);
  const isDark = themeMode === 'dark';
  const { marketId, navigationOptions, idPrepend='' } = props;
  const { actionButtonColor, infoColor } = useButtonColors();
  const [pageStateFull, pageDispatch] = usePageStateReducer('sidebarMenus');
  const [pageState, updatePageState] = getPageReducerPage(pageStateFull, pageDispatch, marketId || 'sidebarState',
    {viewsOpen: true});
  const { viewsOpen } = pageState;
  const { navListItemTextArray, navLowerListItemTextArray, navMenu, navLowerMenu, listOnClick } = navigationOptions || {};
  const firstFiveNavListItemTextArray = navListItemTextArray?.slice(0, 5);
  const moreFiveNavListItemTextArray = navListItemTextArray?.slice(5);
  return (
    <ProSidebar width="16rem" backgroundColor={infoColor} style={{borderRightWidth: '0px'}}>
        {navMenu}
        {!_.isEmpty(navMenu) && (
          <Menu rootStyles={{
            '.ps-menu-button': {paddingLeft: '16px', height: '30px', overflow: 'hidden'},
            '.ps-menu-button:hover': {backgroundColor: isDark ? 'black' : undefined}
          }}
            renderExpandIcon={() => <div onClick={(event)=> {
              preventDefaultAndProp(event);
              if (marketId) {
                navigate(history, `/wizard#type=${PLANNING_TYPE.toLowerCase()}&marketId=${marketId}`);
              }
            }}><Tooltip placement='top' title={intl.formatMessage({ id: 'homeAddGroup' })}>
            <IconButton size="small" id="addViewId">
            <AddIcon htmlColor={marketId ? actionButtonColor : 'disabled'} fontSize="small" />
            </IconButton>
          </Tooltip></div>}>
            <SubMenu id='views'
                    label={intl.formatMessage({ id: 'viewInGroup' })}
                    rootStyles={{
                      '.ps-menuitem-root': {
                        backgroundColor: infoColor
                      }
                    }}
                      key="views" open >
                      {firstFiveNavListItemTextArray?.map((navItem, topIndex) => {
                        const { text, target, num, numSuffix, icon: Icon, complexIcon, onClickFunc, isBold, isBlue, openMenuItems,
                          onEnterFunc, onLeaveFunc, endIcon, resetFunction, tipText, linkHref, iconColor } = navItem;
                        return processRegularItem({history, text, target, num, numSuffix,Icon, complexIcon, onClickFunc, isBold,
                          isBlue, linkHref, index: topIndex, openMenuItems, onEnterFunc, onLeaveFunc, endIcon, resetFunction,
                          tipText, idPrepend, infoColor, iconColor, isDark})
                      })}
                      {navListItemTextArray.length > 5 && (
                        <MenuItem
                          icon={viewsOpen ? <ExpandLess htmlColor={isDark ? DARK_ACTION_BUTTON_COLOR : 'black'} style={{fontSize: '1rem', marginBottom: '0.15rem'}} /> 
                          : <ExpandMore htmlColor={isDark ? DARK_ACTION_BUTTON_COLOR : 'black'} style={{fontSize: '1rem', marginBottom: '0.15rem'}} />}
                          id="moreViewsId"
                          key="moreViewsKey"
                          onClick={(event) => {
                            preventDefaultAndProp(event);
                            updatePageState({viewsOpen: !viewsOpen});
                          }}
                        >
                          {intl.formatMessage({ id: viewsOpen ? 'less' : 'more' })}
                        </MenuItem>
                      )}
                      {viewsOpen && moreFiveNavListItemTextArray?.map((navItem, topIndex) => {
                        const { text, target, num, numSuffix, icon: Icon, complexIcon, onClickFunc, isBold, isBlue, openMenuItems,
                          onEnterFunc, onLeaveFunc, endIcon, resetFunction, tipText, linkHref, iconColor } = navItem;
                        return processRegularItem({history, text, target, num, numSuffix,Icon, complexIcon, onClickFunc, isBold,
                          isBlue, linkHref, index: topIndex, openMenuItems, onEnterFunc, onLeaveFunc, endIcon, resetFunction,
                          tipText, idPrepend, infoColor, iconColor, isDark})
                      })}
              </SubMenu>
          </Menu>
        )}
        <div style={{marginBottom: '1rem'}} />
        {!_.isEmpty(navLowerListItemTextArray) && (
          <Menu 
            rootStyles={{
              '.ps-menu-button': {height: 'unset', paddingLeft: '10px'},
              '.ps-menu-button:hover': {backgroundColor: isDark ? 'black' : undefined}
            }}
            onClick={listOnClick}>
            {navLowerListItemTextArray.map((navItem, topIndex) => {
              const { text, target, num, icon: Icon, complexIcon, onClickFunc, isBold, isBlue, openMenuItems,
                onEnterFunc, onLeaveFunc, endIcon, resetFunction, tipText, linkHref, iconColor } = navItem;
              return processRegularItem({history, text, target, num, Icon, complexIcon, onClickFunc, isBold,
                isBlue, linkHref, index: topIndex, openMenuItems, onEnterFunc, onLeaveFunc, endIcon, resetFunction,
                tipText, idPrepend, infoColor, iconColor, isDark})
            })}
          </Menu>
        )}
        <div style={{marginBottom: '0.5rem'}} />
        {navLowerMenu}
    </ProSidebar>
  );
}