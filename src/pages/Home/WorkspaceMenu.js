import React, { useContext, useState } from 'react';
import { Button, makeStyles, Menu, Tooltip } from '@material-ui/core';
import { Menu as ProMenu, MenuItem, Sidebar as ProSidebar, SubMenu } from 'react-pro-sidebar';
import { useHistory } from 'react-router';
import _ from 'lodash';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import SettingsIcon from '@material-ui/icons/Settings';
import { useIntl } from 'react-intl';
import AgilePlanIcon from '@material-ui/icons/PlaylistAdd';
import AddIcon from '@material-ui/icons/Add';
import { formManageUsersLink, formMarketEditLink, formMarketLink, navigate, preventDefaultAndProp } from '../../utils/marketIdPathFunctions';
import { DEMO_TYPE, WORKSPACE_WIZARD_TYPE } from '../../constants/markets';
import { DoneAll, ExpandLess, ExpandMore, FlagOutlined, GroupOutlined, PermIdentity, Person } from '@material-ui/icons';
import { banUser } from '../../api/users';
import { changeBanStatus, getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';

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
    display: 'flex',
    fontWeight: 'bold',
    '& .MuiButton-endIcon': {
      marginLeft: 0,
      marginRight: 0
    },
    padding: '0px 0px 0px 5px',
    '& .MuiButton-label': {
      lineHeight: '1.2',
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
    paddingTop: '1rem',
    paddingBottom: '1rem'
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
  },
  smallGravatar: {
    width: '30px',
    height: '30px',
    marginTop: '2px'
  }
}));

function WorkspaceMenu(props) {
  const { markets: unfilteredMarkets, defaultMarket, setChosenMarketId, inactiveGroups, chosenGroup } = props;
  const [marketPresencesState, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [commentsState] = useContext(CommentsContext);
  const marketPresences = getMarketPresences(marketPresencesState, defaultMarket?.id) || [];
  const myPresence = marketPresences.find((presence) => presence.current_user) || {};
  const markets = unfilteredMarkets.filter((market) => !market.is_banned);
  const notCurrentMarkets = markets.filter((market) => market.id !== defaultMarket?.id);
  const archivedMarkets = notCurrentMarkets.filter((market) => market.market_stage !== 'Active');
  const classes = useStyles();
  const intl = useIntl();
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const history = useHistory();
  const demos = markets.filter((market) => market.object_type === DEMO_TYPE);
  const nonSupportMarkets = markets.filter((market) => market.market_sub_type !== 'SUPPORT');

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
        <ProMenu>
          <MenuItem icon={<AddIcon htmlColor="black" />}
                    key="addWorkspace Key" id="addWorkspaceIconId"
                    onClick={()=> navigate(history, `/wizard#type=${WORKSPACE_WIZARD_TYPE.toLowerCase()}`)}
          >
            {intl.formatMessage({ id: 'homeAddPlanning' })}
          </MenuItem>
        </ProMenu>
      </ProSidebar>
    );
  }

  return (
    <div style={{marginLeft: '15px', marginBottom: '1rem', marginTop: '1rem'}}>
      <Button
        onClick={recordPositionToggle}
        endIcon={<ExpandMoreIcon style={{fontSize: '1rem', marginLeft: '15px', marginRight: '10px'}} htmlColor="black"/>}
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
          MenuListProps={{ disablePadding: true }}
        >
          <ProSidebar width="14rem">
            <ProMenu 
            rootStyles={{'.ps-menu-button': {height: 'unset', paddingLeft: '10px'}}}
            renderExpandIcon={({ open }) => open ? <ExpandLess style={{marginTop: '0.3rem'}} />: <ExpandMore style={{marginTop: '0.3rem'}} />}>
              <MenuItem icon={<SettingsIcon htmlColor="black" style={{fontSize: '1rem', marginBottom: '0.15rem'}} />}
                  rootStyles={{
                    '.css-wx7wi4': {
                      marginRight: 0,
                    },
                  }}
                  key="settingsIconKey" id="settingsIconId"
                  onClick={goTo(`${formMarketEditLink(defaultMarket.id)}`)}
              >
                {intl.formatMessage({ id: 'workspaceSettings' })}
              </MenuItem>
              <MenuItem icon={<Person htmlColor="black" style={{fontSize: '1rem', marginBottom: '0.15rem'}} />}
                  rootStyles={{
                    '.css-wx7wi4': {
                      marginRight: 0,
                    },
                  }}
                  key="manageUsersKey" id="managerUsersId"
                  onClick={goTo(`${formManageUsersLink(defaultMarket.id)}`)}
              >
                {intl.formatMessage({ id: 'manage' })}
              </MenuItem>
              {!_.isEmpty(inactiveGroups) && (
                <SubMenu label={intl.formatMessage({ id: 'inactiveGroups' })}
                          onClick={(event) => event.stopPropagation() }
                          rootStyles={{
                            '.css-12w9als': {
                              paddingLeft: '16px'
                            },
                          }}
                          key="inactiveGroups">
                  {inactiveGroups.map((group) => {
                    const key = `group${group.id}`;

                    if (chosenGroup?.id === group.id) {
                      return <React.Fragment key={key}/>;
                    }
                    return <MenuItem icon={<GroupOutlined htmlColor="black" style={{fontSize: '1rem', marginBottom: '0.15rem'}} />}
                              rootStyles={{
                                '.css-wx7wi4': {
                                  marginRight: 0,
                                },
                              }}
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
              {!_.isEmpty(archivedMarkets) && (
                <SubMenu label={intl.formatMessage({ id: 'archivedWorkspace' })}
                          onClick={(event) => event.stopPropagation() }
                          rootStyles={{
                            '.css-12w9als': {
                              paddingLeft: '16px'
                            },
                          }}
                          key="archivedWorkspaces">
                  {archivedMarkets.map((market, archiveIndex) => {
                    const key = `market${market.id}`;

                    if (market.id === defaultMarket.id) {
                      return <React.Fragment key={key}/>;
                    }
                    return <MenuItem icon={<AgilePlanIcon htmlColor="black" style={{fontSize: '1rem', marginBottom: '0.15rem'}} />}
                              rootStyles={{
                                '.css-wx7wi4': {
                                  marginRight: 0,
                                },
                              }}
                              id={key}
                              key={key}
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
              <MenuItem icon={<PermIdentity htmlColor="black" style={{fontSize: '1rem', marginBottom: '0.15rem'}} />}
                rootStyles={{
                  '.css-wx7wi4': {
                    marginRight: 0,
                  },
                }}
                key="userPreferencesKey" id="userPreferencesId"
                onClick={() => {
                  recordPositionToggle();
                  navigate(history,'/userPreferences');
                }}
              >
                <Tooltip title={intl.formatMessage({ id: 'userPreferencesHeader' })}>
                  <div>
                    {intl.formatMessage({ id: 'preferences' })}
                  </div>
                </Tooltip>
              </MenuItem>
              {defaultMarket.object_type === DEMO_TYPE && (
                <MenuItem icon={<DoneAll htmlColor="black" style={{fontSize: '1rem', marginBottom: '0.15rem'}} />}
                  rootStyles={{
                    '.css-wx7wi4': {
                      marginRight: 0,
                    },
                  }}
                  key="leaveDemoKey" id="leaveDemoId"
                  onClick={() => {
                    recordPositionToggle();
                    if (_.size(nonSupportMarkets) > _.size(demos)) {
                      setOperationRunning(true);
                      // User already has a non demo market so don't ask him to create another one
                      return banUser(defaultMarket.id, myPresence.id).then(() => {
                              setOperationRunning(false);
                              changeBanStatus(marketPresencesState, marketPresencesDispatch, defaultMarket.id, myPresence.id, true, commentsState);
                              // navigate to another market handled by code in Screen
                            });
                    }
                    navigate(history, `/wizard#type=${WORKSPACE_WIZARD_TYPE.toLowerCase()}`);
                  }}
                >
                  <Tooltip title={intl.formatMessage({ id: 'endDemoExplanation' })}>
                    <div>
                      {intl.formatMessage({ id: 'endDemo' })}
                    </div>
                  </Tooltip>
                </MenuItem>
              )}
              {defaultMarket.object_type === DEMO_TYPE && _.size(demos) < 2 && (
                <MenuItem icon={<FlagOutlined htmlColor="black" style={{fontSize: '1rem', marginBottom: '0.15rem'}} />}
                  rootStyles={{
                    '.css-wx7wi4': {
                      marginRight: 0,
                    },
                  }}
                  key="tryOtherDemoKey" id="tryOtherDemoId"
                  onClick={() => {
                    recordPositionToggle();
                    navigate(history, '/demo');
                  }}
                >
                  <Tooltip title={intl.formatMessage({ id: 'otherDemoExplanation' })}>
                    <div>
                      {intl.formatMessage({ id: 'otherDemo' })}
                    </div>
                  </Tooltip>
                </MenuItem>
              )}
            </ProMenu>
          </ProSidebar>
        </Menu>
      )}
    </div>
  );
}

export default WorkspaceMenu;
