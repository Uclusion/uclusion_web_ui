import './Sidebar.scss';
import _ from 'lodash'
import React from 'react'
import { navigate } from '../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import { Menu, MenuItem, ProSidebar, SidebarContent, SidebarHeader } from 'react-pro-sidebar'
import { IconButton, Tooltip, Typography } from '@material-ui/core';
import Link from '@material-ui/core/Link';

function processRegularItem(properties) {
  const {history, text, target, num, Icon, iconColor='black', onClickFunc, isBold, isBlue, complexIcon,
    index, openMenuItems, isLarge, isSubMenu, onEnterFunc, onLeaveFunc, endIcon: EndIcon, linkHref,
    resetFunction, tipText, idPrepend='', numSuffix=''} = properties;
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
        <span style={{paddingLeft: '1.5rem', fontSize: '1.1rem', fontWeight: 'bold'}}>
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
  const backgroundColor = isBold && !isSubMenu && isBlue ? '#84B1D9' : undefined;
  const textRepresentation = isBold ? (<span
      style={{fontWeight: 'bold', fontSize: isLarge ? '1.2rem' : undefined,
        marginLeft: complexIcon ? '0.5rem' : undefined,
        textDecoration: isLink ? 'underline' : undefined, color: isLink ? '#36A2EB' : undefined}}>
            {text}</span>)
    : <span style={{fontSize: isLarge ? '1.2rem' : undefined, marginLeft: complexIcon ? '0.5rem' : undefined,}}>
      {text}</span>;
  const useIdPrepend =  complexIcon ? idPrepend + index : idPrepend;
  return (
    <div key={`sidebarMenuHolder${key}`}>
      <MenuItem icon={complexIcon ? <div /> :<Icon style={{fontSize: '1.3rem', paddingBottom: isLarge ? undefined :'2px'}}
                                                htmlColor={iconColor} />}
                style={{backgroundColor, borderRadius: 22, width: '97%',
                marginLeft: 'auto', marginRight: 'auto'}}
                key={key} id={`${useIdPrepend}${textNoSpaces}`}
                suffix={num > 0 ?
                  <Typography style={{ fontWeight: 'bold', paddingRight: '0.25rem' }} >{num} {numSuffix}</Typography>
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
        {complexIcon && (
          <div style={{display: 'flex', alignItems: 'center'}}>
            {Icon} {textRepresentation}
          </div>
        )}
        {!complexIcon && textRepresentation}
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
  const { navigationOptions, idPrepend='' } = props;
  const { navListItemTextArray, navLowerListItemTextArray, navMenu, navLowerMenu,
    listOnClick, headerItemTextArray } = navigationOptions || {};
  return (
    <ProSidebar width="16rem">
      <SidebarHeader style={{borderBottom: 'unset'}}>
        {!_.isEmpty(headerItemTextArray) && (
          <Menu onClick={listOnClick} iconShape="circle">
            {headerItemTextArray.map((navItem, topIndex) => {
              const { text, target, num, numSuffix, icon: Icon, onClickFunc, isBold, isBlue, openMenuItems,
                iconColor } = navItem;
              return processRegularItem({history, text, target, num, Icon, iconColor, onClickFunc,
                isBold, isBlue, index: topIndex, openMenuItems, isLarge: true, numSuffix})
            })}
          </Menu>
        )}
      </SidebarHeader>
      <SidebarContent>
        {navMenu}
      {!_.isEmpty(navListItemTextArray) && (
        <Menu onClick={listOnClick} iconShape="circle" style={{paddingTop: '5px'}}>
          {navListItemTextArray.map((navItem, topIndex) => {
            const { text, target, num, numSuffix, icon: Icon, complexIcon, onClickFunc, isBold, isBlue, openMenuItems,
              onEnterFunc, onLeaveFunc, endIcon, resetFunction, tipText, linkHref } = navItem;
            return processRegularItem({history, text, target, num, numSuffix,Icon, complexIcon, onClickFunc, isBold,
              isBlue, linkHref, index: topIndex, openMenuItems, onEnterFunc, onLeaveFunc, endIcon, resetFunction,
              tipText, idPrepend})
          })}
        </Menu>
      )}
        {navLowerMenu}
        {!_.isEmpty(navLowerListItemTextArray) && (
          <Menu onClick={listOnClick} iconShape="circle">
            {navLowerListItemTextArray.map((navItem, topIndex) => {
              const { text, target, num, icon: Icon, complexIcon, onClickFunc, isBold, isBlue, openMenuItems,
                onEnterFunc, onLeaveFunc, endIcon, resetFunction, tipText, linkHref } = navItem;
              return processRegularItem({history, text, target, num, Icon, complexIcon, onClickFunc, isBold,
                isBlue, linkHref, index: topIndex, openMenuItems, onEnterFunc, onLeaveFunc, endIcon, resetFunction,
                tipText, idPrepend})
            })}
          </Menu>
        )}
      </SidebarContent>
    </ProSidebar>
  );
}