import _ from 'lodash'
import List from '@material-ui/core/List'
import { ListItem, ListItemText } from '@material-ui/core'
import SearchBox from '../Search/SearchBox'
import React from 'react'
import clsx from 'clsx'
import { navigate } from '../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'

function processRegularItem (classes, history, text, target, num, Icon, onClickFunc, isGrouped, isBold, newPage,
  index, search, showSearch, isGreyed) {
  if (!text) {
    return React.Fragment
  }
  const textNoSpaces = text.split(' ').join('')
  if (!target && !onClickFunc) {
    return (
      <ListItem key={`noOnClick${index}${textNoSpaces}`} style={{cursor: 'unset'}}
                className={isGrouped ? classes.navListItemGrouped : classes.navListItem}>
        {Icon && (
          <Icon className={clsx(classes.navListIcon, classes.disabled)}/>
        )}
        <ListItemText primary={text} primaryTypographyProps={{ className: classes.disabled }}/>
      </ListItem>
    )
  }
  return (
    <ListItem key={`${index}${textNoSpaces}`} id={textNoSpaces} selected={isBold}
              className={isGrouped ? classes.navListItemGrouped : classes.navListItem}
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
      {Icon && (
        <Icon className={classes.navListIcon} />
      )}
      <span style={{width: showSearch ? '80%' : '100%'}}>
                      <ListItemText primary={text}
                                    primaryTypographyProps={{className: isBold ? classes.navGroupHeader :
                                        (isGreyed ? classes.navGroupGreyed : undefined)}} />
                    </span>
      {num !== undefined && !_.isEmpty(search) && (
        <span style={{width: "17%"}}><ListItemText primary={num} /></span>
      )}
    </ListItem>
  );
}

export default function Sidebar(props) {
  const history = useHistory();
  const { navigationOptions, search, title, classes } = props;
  const { navListItemTextArray, navMenu, showSearch = true, listOnClick } = navigationOptions || {};
  return (
    <>
      {navMenu}
      {!_.isEmpty(navListItemTextArray) && (
        <List onClick={listOnClick}>
          {navListItemTextArray.map((navItem, topIndex) => {
            const { text, target, num, icon: Icon, onClickFunc, subItems, isBold, newPage, isGreyed } = navItem;
            if (subItems) {
              return (
                <div key={`top${topIndex}${text}${title}`}
                     style={{ paddingBottom: '0.5rem', backgroundColor: '#F5F5F5' }}>
                  <ListItem key={`topListItem${topIndex}${text}${title}`} onClick={onClickFunc}
                            style={{ paddingBottom: 0, cursor: 'pointer' }}>
                    <ListItemText primary={text}
                                  primaryTypographyProps={{ className: isBold ? classes.navGroupHeader : undefined }}
                    />
                  </ListItem>
                  <div>
                    {subItems.map((subItem, index) => {
                      const { text, target, num, icon: Icon, onClickFunc, newPage } = subItem
                      return processRegularItem(classes, history, text, target, num, Icon, onClickFunc,
                        true, false, newPage, index, search, showSearch, isGreyed)
                    })}
                  </div>
                </div>
              );
            }
            return processRegularItem(classes, history, text, target, num, Icon, onClickFunc, false,
              isBold, newPage, topIndex, search, showSearch, isGreyed)
          })}
        </List>
      )}
      {showSearch && (
        <SearchBox/>
      )}
    </>
  );
}