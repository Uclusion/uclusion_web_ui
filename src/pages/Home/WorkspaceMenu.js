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
import { AddAlert, GroupOutlined, PermIdentity, VpnKey } from '@material-ui/icons';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import { usePlanFormStyles } from '../../components/AgilePlan';
import GravatarAndName from '../../components/Avatars/GravatarAndName';
import ReturnTop from './ReturnTop';
import { PLACEHOLDER } from '../../constants/global';
import { fixName } from '../../utils/userFunctions';
import config from '../../config';
import { AccountContext } from '../../contexts/AccountContext/AccountContext';

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

function WorkspaceMenu(props) {
  const { markets: unfilteredMarkets, defaultMarket, setChosenMarketId, inactiveGroups, chosenGroup, action,
    pathInvestibleId, pathMarketIdRaw, hashInvestibleId, useLink, typeObjectId } = props;
  const markets = unfilteredMarkets.filter((market) => !market.is_banned);
  const notCurrentMarkets = markets.filter((market) => market.id !== defaultMarket?.id);
  const activeMarkets = notCurrentMarkets.filter((market) => market.market_stage === 'Active');
  const archivedMarkets = notCurrentMarkets.filter((market) => market.market_stage !== 'Active');
  const classes = useStyles();
  const identityListClasses = usePlanFormStyles();
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [userState] = useContext(AccountContext) || {};
  const intl = useIntl();
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [switchWorkspaceOpen, setSwitchWorkspaceOpen] = useState(false);
  const history = useHistory();
  const { user } = userState;
  const notificationConfig = user?.notification_configs?.find((config) =>
    config.market_id === defaultMarket.id);
  const slackAddressable = notificationConfig?.is_slack_addressable;
  const marketPresences = getMarketPresences(marketPresencesState, defaultMarket.id) || [];
  const presencesOrdered =  _.orderBy(marketPresences, ['name'], ['asc']);

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
  const isArchivedWorkspace = defaultMarket?.market_stage !== 'Active';
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
                <MenuItem icon={<VpnKey style={{fontSize: '1.3rem', paddingBottom: '2px'}} htmlColor="black" />}
                          key="integrationKey" id="integrationId"
                          onClick={() => {
                            recordPositionToggle();
                            navigate(history,`/integrationPreferences/${defaultMarket?.id}?groupId=${chosenGroup}`);
                          }}
                >
                  <Tooltip title={intl.formatMessage({ id: 'integrationPreferencesHeader' })}>
                    <div>
                      {intl.formatMessage({ id: 'cliIntegration' })}
                    </div>
                  </Tooltip>
                </MenuItem>
                {slackAddressable && (
                  <MenuItem icon={<AddAlert style={{fontSize: '1.3rem', paddingBottom: '2px'}} htmlColor="black" />}
                            key="slackIntegrationKey" id="slackIntegrationId"
                            onClick={() => {
                              recordPositionToggle();
                              navigate(history,'/integrationPreferences');
                            }}
                  >
                    <Tooltip title={intl.formatMessage({ id: 'slackIntegrationExplanation' })}>
                      <div>
                        {intl.formatMessage({ id: 'slackIntegration' })}
                      </div>
                    </Tooltip>
                  </MenuItem>
                )}
                {!slackAddressable && (
                  <a
                    href={`${config.add_to_slack_url}&state=${user?.id}_${defaultMarket.id}`}
                    rel="noopener noreferrer"
                    style={{paddingLeft: '15px'}}
                  >
                    <img
                      alt="Add to Slack"
                      height="40"
                      width="139"
                      src="https://platform.slack-edge.com/img/add_to_slack.png"
                      srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x"
                    />
                  </a>
                )}
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
          {presencesOrdered.map((presence) => <GravatarAndName
              key={presence.id}
              email={presence.email}
              name={fixName(presence.name)}
              typographyVariant="caption"
              typographyClassName={presence.placeholder_type === PLACEHOLDER ? identityListClasses.avatarNameYellow :
                identityListClasses.avatarName}
              avatarClassName={classes.smallGravatar}
            />
          )}
        </List>
      )}
      <ProSidebar width="14rem" style={{marginTop: '0.5rem'}}>
        <SidebarContent>
          <ProMenu iconShape="circle" style={{paddingBottom: 0}}>
            <SubMenu id='switchWorkspace' title={intl.formatMessage({ id: 'switchWorkspace' })}
                     onClick={(event) => {
                       event.stopPropagation();
                       setSwitchWorkspaceOpen(!switchWorkspaceOpen);
                     }}
                     key="switchWorkspace" open={switchWorkspaceOpen}>
              {activeMarkets.map((market) => {
                const key = `market${market.id}`;

                if (market.id === defaultMarket.id) {
                  return <React.Fragment key={key}/>;
                }
                return <MenuItem
                  icon={<AgilePlanIcon style={{fontSize: '1.3rem', paddingBottom: '2px'}}
                                                      htmlColor="black" fontSize='small' />}
                  id={key}
                  key={key}
                  style={{paddingLeft: '-15px', marginLeft: '-15px'}}
                  onClick={(event) => {
                    event.stopPropagation();
                    setChosenMarketId(market.id);
                    setSwitchWorkspaceOpen(false);
                  }}
                >
                  {market.name}
                </MenuItem>
              })}
              <MenuItem icon={<AddIcon style={{fontSize: '1.3rem', paddingBottom: '2px'}} htmlColor="black" />}
                        key="addWorkspace Key" id="addWorkspaceIconId"
                        style={{paddingLeft: '-15px', marginLeft: '-15px'}}
                        onClick={()=> {
                          navigate(history, `/wizard#type=${WORKSPACE_WIZARD_TYPE.toLowerCase()}`);
                        }}
              >
                <Tooltip title={intl.formatMessage({ id: 'workspaceExplanationTooltip' })}>
                  <div>
                    {intl.formatMessage({ id: 'homeAddPlanning' })}
                  </div>
                </Tooltip>
              </MenuItem>
            </SubMenu>
          </ProMenu>
        </SidebarContent>
      </ProSidebar>
    </div>
  );
}

export default WorkspaceMenu;
