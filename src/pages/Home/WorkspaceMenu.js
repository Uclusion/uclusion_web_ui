import React, { useState } from 'react';
import {
  Button,
  makeStyles,
  Menu
} from '@material-ui/core'
import { MenuItem, ProSidebar, SidebarContent, Menu as ProMenu, SubMenu } from 'react-pro-sidebar'
import { useHistory } from 'react-router'
import _ from 'lodash'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import SettingsIcon from '@material-ui/icons/Settings'
import { useIntl } from 'react-intl'
import AgilePlanIcon from '@material-ui/icons/PlaylistAdd'
import AddIcon from '@material-ui/icons/Add'
import { formMarketEditLink } from '../../utils/marketIdPathFunctions'

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
    fontSize: '1.25rem',
    width: '100%',
    '& .MuiButton-label': {
      lineHeight: '.7'
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
  const { markets, defaultMarket, setChosenMarketId, setOpen } = props;
  const classes = useStyles();
  const intl = useIntl();
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const history = useHistory();
  const recordPositionToggle = (event) => {
    if (anchorEl === null) {
      setAnchorEl(event.currentTarget);
      setMenuOpen(true);
    } else {
      setAnchorEl(null);
      setMenuOpen(false);
    }
  };

  function goTo (to) {
    return () => {
      setAnchorEl(null);
      history.push(to);
    };
  }

  if (_.isEmpty(markets)) {
    return React.Fragment;
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
                <MenuItem icon={<AddIcon htmlColor="black" />}
                          key="addWorkspaceNewUsersKey" id="addWorkspaceIconId"
                          onClick={()=> setOpen('addNewUsers')}
                >
                  {intl.formatMessage({ id: 'dialogAddParticipantsLabel' })}
                </MenuItem>
                <MenuItem icon={<AddIcon htmlColor="black" />}
                          key="addWorkspace Key" id="addWorkspaceIconId"
                          onClick={()=> setOpen('addMarket')}
                >
                  {intl.formatMessage({ id: 'homeAddPlanning' })}
                </MenuItem>
                <SubMenu title={intl.formatMessage({ id: 'switchWorkspace' })}
                         key="switchWorkspace" style={{paddingLeft: '0.7rem'}}>
                  {markets.map((market) => {
                    const key = `market${market.id}`;

                    if (market.id === defaultMarket.id) {
                      return <React.Fragment key={key}/>;
                    }
                    return <MenuItem icon={<AgilePlanIcon htmlColor="black" />}
                                     id={key}
                                     key={key}
                                     onClick={() => setChosenMarketId(market.id)}
                    >
                      {market.name}
                    </MenuItem>
                  })}
                </SubMenu>
                <MenuItem icon={<SettingsIcon htmlColor="black" />}
                          key="settingsIconKey" id="settingsIconId"
                          onClick={goTo(`${formMarketEditLink(defaultMarket.id)}`)}
                >
                  {intl.formatMessage({ id: 'settings' })}
                </MenuItem>
              </ProMenu>
            </SidebarContent>
          </ProSidebar>
        </Menu>
      )}
    </div>
  );
}

export default WorkspaceMenu;
