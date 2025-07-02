import React, { useContext, useState } from 'react';
import { Button, List, makeStyles, Menu, Tooltip } from '@material-ui/core';
import { Menu as ProMenu, MenuItem, ProSidebar, SidebarContent, SubMenu } from 'react-pro-sidebar';
import { useHistory } from 'react-router';
import _ from 'lodash';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import SettingsIcon from '@material-ui/icons/Settings';
import { useIntl } from 'react-intl';
import AgilePlanIcon from '@material-ui/icons/PlaylistAdd';
import AddIcon from '@material-ui/icons/Add';
import { formMarketEditLink, formMarketLink, navigate, preventDefaultAndProp } from '../../utils/marketIdPathFunctions';
import { WORKSPACE_WIZARD_TYPE } from '../../constants/markets';
import { GroupOutlined, PermIdentity } from '@material-ui/icons';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import { usePlanFormStyles } from '../../components/AgilePlan';
import GravatarAndName from '../../components/Avatars/GravatarAndName';
import ReturnTop from './ReturnTop';
import { PLACEHOLDER } from '../../constants/global';
import { fixName } from '../../utils/userFunctions';
import { GroupMembersContext } from '../../contexts/GroupMembersContext/GroupMembersContext';
import { MarketGroupsContext } from '../../contexts/MarketGroupsContext/MarketGroupsContext';

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

function MemberDisplay(props) {
  const { presence, index, recordPresenceToggle } = props;
  const classes = useStyles();
  const identityListClasses = usePlanFormStyles();
  return <div id={index} onClick={(event) => recordPresenceToggle(event, presence)} >
    <GravatarAndName
      key={presence.id}
      email={presence.email}
      name={fixName(presence.name)}
      typographyVariant="caption"
      typographyClassName={presence.placeholder_type === PLACEHOLDER ?
        identityListClasses.avatarNameYellowLink : identityListClasses.avatarNameLink}
      avatarClassName={classes.smallGravatar}
    />
  </div>;
}

function WorkspaceMenu(props) {
  const { markets: unfilteredMarkets, defaultMarket, setChosenMarketId, inactiveGroups, chosenGroup, action,
    pathInvestibleId, pathMarketIdRaw, hashInvestibleId, useLink, typeObjectId } = props;
  const markets = unfilteredMarkets.filter((market) => !market.is_banned);
  const notCurrentMarkets = markets.filter((market) => market.id !== defaultMarket?.id);
  const archivedMarkets = notCurrentMarkets.filter((market) => market.market_stage !== 'Active');
  const classes = useStyles();
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [groupsState] = useContext(MarketGroupsContext);
  const [groupPresencesState] = useContext(GroupMembersContext);
  const intl = useIntl();
  const [anchorEl, setAnchorEl] = useState(null);
  const [presenceAnchor, setPresenceAnchor] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [presenceMenuId, setPresenceMenuId] = useState(undefined);
  const history = useHistory();
  const marketPresences = getMarketPresences(marketPresencesState, defaultMarket?.id) || [];
  const presencesOrdered =  _.orderBy(marketPresences, ['name'], ['asc']);
  const marketGroups = groupsState[defaultMarket?.id] || [];
  const presenceMenuGroups = marketGroups.filter((group) => {
    const groupCapabilities = groupPresencesState[group.id] || [];
    return !_.isEmpty(groupCapabilities.find((groupCapability) => !groupCapability.deleted
      && groupCapability.id === presenceMenuId));
  });
  const presenceMenuGroupsOrdered = _.orderBy(presenceMenuGroups, ['name'], ['asc']);

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

  const recordPresenceToggle = (event, presence) => {
    if (presenceAnchor === null) {
      preventDefaultAndProp(event);
      setPresenceAnchor(event.currentTarget);
      setPresenceMenuId(presence.id);
    } else {
      setPresenceAnchor(null);
      setPresenceMenuId(undefined);
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
  const isArchivedWorkspace = defaultMarket.market_stage !== 'Active';
  return (
    <div style={{marginLeft: '15px'}}>
      <ReturnTop action={action} pathInvestibleId={pathInvestibleId} market={defaultMarket}
                 isArchivedWorkspace={isArchivedWorkspace} useLink={useLink} typeObjectId={typeObjectId}
                 groupId={chosenGroup} pathMarketIdRaw={pathMarketIdRaw} hashInvestibleId={hashInvestibleId}/>
      <Button
        onClick={recordPositionToggle}
        endIcon={<ExpandMoreIcon style={{fontSize: '1rem', marginLeft: 0, marginRight: '10px'}} htmlColor="black"/>}
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
            <SidebarContent>
              <ProMenu iconShape="circle">
                <MenuItem icon={<SettingsIcon style={{fontSize: '1.3rem', paddingBottom: '2px'}}
                                              htmlColor="black" fontSize='small' />}
                          key="settingsIconKey" id="settingsIconId"
                          onClick={goTo(`${formMarketEditLink(defaultMarket.id)}`)}
                >
                  {intl.formatMessage({ id: 'workspaceSettings' })}
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
                      return <MenuItem icon={<GroupOutlined style={{fontSize: '1.3rem', paddingBottom: '2px'}}
                                                            htmlColor="black" />}
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
                  <SubMenu title={intl.formatMessage({ id: 'archivedWorkspace' })}
                           onClick={(event) => event.stopPropagation() }
                           style={{paddingLeft: '0.7rem'}}
                           key="archivedWorkspaces">
                    {archivedMarkets.map((market, archiveIndex) => {
                      const key = `market${market.id}`;

                      if (market.id === defaultMarket.id) {
                        return <React.Fragment key={key}/>;
                      }
                      return <MenuItem icon={<AgilePlanIcon style={{fontSize: '1.3rem', paddingBottom: '2px'}}
                                                            htmlColor="black" fontSize='small' />}
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
                <MenuItem icon={<PermIdentity style={{fontSize: '1.3rem', paddingBottom: '2px'}} htmlColor="black" />}
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
              </ProMenu>
            </SidebarContent>
          </ProSidebar>
        </Menu>
      )}
      {_.size(marketPresences) < 10 && _.size(marketPresences) > 1 && (
        <List
          dense
          id="addressesOfWorkspace"
          style={{marginTop: '0.5rem'}}
        >
          {presencesOrdered.map((presence, index) =>
            <MemberDisplay presence={presence} index={index} recordPresenceToggle={recordPresenceToggle} />)}
        </List>
      )}
      {presenceAnchor && (
        <Menu
          id="presence-menu"
          open={presenceMenuId !== undefined}
          onClose={recordPresenceToggle}
          getContentAnchorEl={null}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          anchorEl={presenceAnchor}
          disableRestoreFocus
          classes={{ paper: classes.paperMenu }}
          MenuListProps={{ disablePadding: true }}
        >
          <ProSidebar width="8rem">
            <SidebarContent>
              <ProMenu iconShape="circle">
                {_.isEmpty(presenceMenuGroups) && (
                  <div style={{marginLeft: '10px', fontWeight: 'bold', marginTop: '2px'}}>
                    {intl.formatMessage({ id: 'noViews' })}
                  </div>
                )}
                {!_.isEmpty(presenceMenuGroups) && (
                  <div style={{marginLeft: '10px', fontWeight: 'bold', marginTop: '2px'}}>
                    {intl.formatMessage({ id: 'viewInGroup' })}
                  </div>
                )}
                {presenceMenuGroupsOrdered.map((group, index) => {
                  return <MenuItem key={`view${index}Key`} id={`view${index}Id`}
                                   style={{marginTop: index === 0 ? '8px' : undefined,
                                     marginBottom: index === _.size(presenceMenuGroupsOrdered) - 1 ? '5px' : '8px',
                                     marginLeft: '5px'}}
                                   onClick={()=> {
                                     recordPresenceToggle();
                                     navigate(history, formMarketLink(defaultMarket.id, group.id));
                                   }}>
                    {group.name}
                  </MenuItem>
                })}
              </ProMenu>
            </SidebarContent>
          </ProSidebar>
        </Menu>
      )}
    </div>
  );
}

export default WorkspaceMenu;
