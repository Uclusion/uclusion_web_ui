import React, { useState } from 'react';
import { Button, makeStyles, Menu } from '@material-ui/core';
import { Menu as ProMenu, MenuItem, ProSidebar, SidebarContent, SubMenu } from 'react-pro-sidebar';
import { useHistory } from 'react-router';
import _ from 'lodash';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import SettingsIcon from '@material-ui/icons/Settings';
import { useIntl } from 'react-intl';
import AgilePlanIcon from '@material-ui/icons/PlaylistAdd';
import AddIcon from '@material-ui/icons/Add';
import { formMarketEditLink, formMarketLink, navigate, preventDefaultAndProp } from '../../utils/marketIdPathFunctions';
import { PLANNING_TYPE, WORKSPACE_WIZARD_TYPE } from '../../constants/markets';
import { GroupOutlined } from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
  name: {
    color: theme.palette.text.primary,
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.75rem'
    },
  },
  menuStyle: {
    position: 'relative',
  },
  terms: {
    textAlign: 'center',
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
  },
  identityBlock: {
    paddingBottom: theme.spacing(1),
    paddingLeft: '1rem',
    paddingRight: '1rem',
    textAlign: 'center',
    minWidth: '15rem'
  },
  termsLink: {
    color: theme.palette.text.secondary,
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.75rem'
    },
  },
  buttonClass: {
    textTransform: 'none',
    border: '1px solid',
    borderRadius: '8px',
    fontSize: '1rem',
    marginLeft: 'auto',
    marginRight: 'auto',
    display: 'flex',
    width: '90%',
    '& .MuiButton-label': {
      lineHeight: '1.2'
    },
    [theme.breakpoints.down('sm')]: {
      width: 'auto',
      minWidth: 'auto',
      '& .MuiButton-endIcon': {
        margin: 0
      }
    },
  },
  paperMenu: {
    border: '0.5px solid grey',
  },
  listAction: {
    paddingTop: '1rem',
    paddingBottom: 0,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  signOut: {
    textAlign: 'center',
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(1),
  },
  largeAvatar: {
    width: theme.spacing(8),
    height: theme.spacing(8),
    display: 'block',
    marginLeft: 'auto',
    marginRight: 'auto',
    fontSize: theme.spacing(4),
  },
  user: {
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    },
  }
}));

function WorkspaceMenu(props) {
  const { markets: unfilteredMarkets, defaultMarket, setChosenMarketId, inactiveGroups, chosenGroup } = props;
  const markets = unfilteredMarkets.filter((market) => !market.is_banned);
  const classes = useStyles();
  const intl = useIntl();
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const history = useHistory();
  const recordPositionToggle = (event) => {
    if (anchorEl === null) {
      preventDefaultAndProp(event);
      setAnchorEl(event.currentTarget);
      setMenuOpen(true);
    } else {
      setAnchorEl(null);
      setMenuOpen(false);
    }
  };

  function goTo (to) {
    return () => {
      recordPositionToggle();
      history.push(to);
    };
  }

  if (_.isEmpty(markets)||_.isEmpty(defaultMarket)) {
    return (
      <ProSidebar width="14rem">
        <SidebarContent>
          <ProMenu iconShape="circle">
            <MenuItem icon={<AddIcon htmlColor="black" />}
                      key="addWorkspace Key" id="addWorkspaceIconId"
                      onClick={()=> navigate(history, `/wizard#type=${WORKSPACE_WIZARD_TYPE.toLowerCase()}`)}
            >
              {intl.formatMessage({ id: 'homeAddPlanning' })}
            </MenuItem>
          </ProMenu>
        </SidebarContent>
      </ProSidebar>
    );
  }

  return (
    <div style={{paddingTop: '1rem'}}>
      <Button
        onClick={recordPositionToggle}
        endIcon={<ExpandMoreIcon htmlColor="black"/>}
        className={classes.buttonClass}
        id="workspaceMenuButton"
      >
        {defaultMarket.name}
      </Button>
      {anchorEl && (
        <Menu
          id="profile-menu"
          open={menuOpen}
          onClose={recordPositionToggle}
          getContentAnchorEl={null}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          anchorEl={anchorEl}
          disableRestoreFocus
          classes={{ paper: classes.paperMenu }}
        >
          <ProSidebar width="14rem">
            <SidebarContent>
              <ProMenu iconShape="circle">
                <MenuItem icon={<SettingsIcon htmlColor="black" fontSize='small' />}
                          key="settingsIconKey" id="settingsIconId"
                          style={{marginBottom: '1rem'}}
                          onClick={goTo(`${formMarketEditLink(defaultMarket.id)}`)}
                >
                  {intl.formatMessage({ id: 'settings' })}
                </MenuItem>
                <MenuItem icon={<AddIcon htmlColor="black" />}
                          key="addGroupKey" id="addGroupId"
                          style={{marginBottom: '1rem'}}
                          onClick={() => {
                            recordPositionToggle();
                            navigate(history,
                              `/wizard#type=${PLANNING_TYPE.toLowerCase()}&marketId=${defaultMarket.id}`);
                          }}
                >
                  {intl.formatMessage({ id: 'homeAddGroup' })}
                </MenuItem>
                {!_.isEmpty(inactiveGroups) && (
                  <SubMenu title={intl.formatMessage({ id: 'inactiveGroups' })}
                           onClick={(event) => event.stopPropagation() }
                           key="inactiveGroups" style={{paddingLeft: '0.7rem'}}>
                    {inactiveGroups.map((group) => {
                      const key = `group${group.id}`;

                      if (chosenGroup?.id === group.id) {
                        return <React.Fragment key={key}/>;
                      }
                      return <MenuItem icon={<GroupOutlined htmlColor="black" />}
                                       id={key}
                                       key={key}
                                       onClick={() => {
                                         navigate(history, formMarketLink(defaultMarket.id, group.id))
                                       }}
                      >
                        {group.name}
                      </MenuItem>
                    })}
                  </SubMenu>
                )}
                <MenuItem icon={<AddIcon htmlColor="black" />}
                          key="addWorkspace Key" id="addWorkspaceIconId"
                          style={{marginTop: '1rem', marginBottom: '1rem'}}
                          onClick={()=> {
                            recordPositionToggle();
                            navigate(history, `/wizard#type=${WORKSPACE_WIZARD_TYPE.toLowerCase()}`);
                          }}
                >
                  {intl.formatMessage({ id: 'homeAddPlanning' })}
                </MenuItem>
                {_.size(markets) > 1 && (
                  <SubMenu title={intl.formatMessage({ id: 'switchWorkspace' })}
                           onClick={(event) => event.stopPropagation() }
                           key="switchWorkspace" style={{paddingLeft: '0.7rem'}}>
                    {markets.map((market) => {
                      const key = `market${market.id}`;

                      if (market.id === defaultMarket.id) {
                        return <React.Fragment key={key}/>;
                      }
                      return <MenuItem icon={<AgilePlanIcon htmlColor="black" fontSize='small' />}
                                       id={key}
                                       key={key}
                                       style={{paddingLeft: '-15px', marginLeft: '-15px'}}
                                       onClick={() => {
                                         recordPositionToggle();
                                         setChosenMarketId(market.id);
                                       }}
                      >
                        {market.name}
                      </MenuItem>
                    })}
                  </SubMenu>
                )}
              </ProMenu>
            </SidebarContent>
          </ProSidebar>
        </Menu>
      )}
    </div>
  );
}

export default WorkspaceMenu;
