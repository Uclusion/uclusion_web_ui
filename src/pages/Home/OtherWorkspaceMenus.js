import React, { useContext, useState } from 'react';
import { makeStyles, Menu, Tooltip } from '@material-ui/core';
import { Menu as ProMenu, MenuItem, Sidebar, SubMenu } from 'react-pro-sidebar';
import { useHistory } from 'react-router';
import _ from 'lodash';
import { useIntl } from 'react-intl';
import AgilePlanIcon from '@material-ui/icons/PlaylistAdd';
import AddIcon from '@material-ui/icons/Add';
import { formMarketLink, navigate, preventDefaultAndProp } from '../../utils/marketIdPathFunctions';
import { ADD_COLLABORATOR_WIZARD_TYPE, WORKSPACE_WIZARD_TYPE } from '../../constants/markets';
import { AccountContext } from '../../contexts/AccountContext/AccountContext';
import { AddAlert, ExpandLess, ExpandMore, Face, VpnKey } from '@material-ui/icons';
import config from '../../config';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { MarketGroupsContext } from '../../contexts/MarketGroupsContext/MarketGroupsContext';
import { GroupMembersContext } from '../../contexts/GroupMembersContext/GroupMembersContext';
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import { getPageReducerPage, usePageStateReducer } from '../../components/PageState/pageStateHooks';
import { hideShowExpandIcon } from '../../utils/windowUtils';
import GravatarGroup from '../../components/Avatars/GravatarGroup';


const useStyles = makeStyles(() => ({
  paperMenu: {
    border: '0.5px solid grey',
  },
  smallGravatar: {
    width: '30px',
    height: '30px',
    marginTop: '2px',
    cursor: 'pointer'
  }
}));

function OtherWorkspaceMenus(props) {
  const { markets: unfilteredMarkets, defaultMarket, setChosenMarketId, chosenGroup, mobileLayout } = props;
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [groupsState] = useContext(MarketGroupsContext);
  const [groupPresencesState] = useContext(GroupMembersContext);
  const [userState] = useContext(AccountContext) || {};
  const markets = unfilteredMarkets.filter((market) => !market.is_banned);
  const notCurrentMarkets = markets.filter((market) => market.id !== defaultMarket?.id);
  const activeMarkets = notCurrentMarkets.filter((market) => market.market_stage === 'Active');
  const intl = useIntl();
  const [pageStateFull, pageDispatch] = usePageStateReducer('otherMenus');
  const [pageState, updatePageState] = getPageReducerPage(pageStateFull, pageDispatch, 'menuState',
    {switchWorkspaceOpen: true, integrationsOpen: false, collaboratorsOpen: !mobileLayout});
  const { switchWorkspaceOpen, integrationsOpen, collaboratorsOpen } = pageState;
  const [presenceAnchor, setPresenceAnchor] = useState(null);
  const [presenceMenuId, setPresenceMenuId] = useState(undefined);
  const history = useHistory();
  const classes = useStyles();
  const { user } = userState;
  const notificationConfig = user?.notification_configs?.find((config) =>
    config.market_id === defaultMarket?.id);
  const slackAddressable = notificationConfig?.is_slack_addressable;
  const marketPresences = getMarketPresences(marketPresencesState, defaultMarket?.id) || [];
  const presencesOrdered =  _.orderBy(marketPresences, ['name'], ['asc']);
  const marketGroups = groupsState[defaultMarket?.id] || [];
  const presenceMenuGroups = marketGroups.filter((group) => {
    const groupCapabilities = groupPresencesState[group.id] || [];
    return !_.isEmpty(groupCapabilities.find((groupCapability) => !groupCapability.deleted
      && groupCapability.id === presenceMenuId));
  });
  const presenceMenuGroupsOrdered = _.orderBy(presenceMenuGroups, ['name'], ['asc']);

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

  if (_.isEmpty(markets)||_.isEmpty(defaultMarket)) {
    return React.Fragment;
  }

  return (
    <div style={{marginLeft: '15px', marginTop: '1rem', marginBottom: '10px'}}>
      <Sidebar width="14rem" backgroundColor="#DFF0F2">
        <ProMenu 
          rootStyles={{'.ps-menu-button': {paddingLeft: '10px', height: '30px', overflow: 'hidden'}}}
          renderExpandIcon={({ open }) => open ? <ExpandLess style={{marginTop: '0.3rem', display: 'none'}} />
            : <ExpandMore style={{marginTop: '0.3rem', display: 'none'}} />}>
            <SubMenu id='collaborators'
                    label={intl.formatMessage({ id: 'collaborators' })}
                    onMouseOver={hideShowExpandIcon('collaborators', true)}
                    onMouseOut={hideShowExpandIcon('collaborators', false)}
                    rootStyles={{
                      '.css-nx2aea': {
                        backgroundColor: '#DFF0F2'
                      }
                    }}
                    onClick={(event) => {
                      preventDefaultAndProp(event);
                      updatePageState({collaboratorsOpen: !collaboratorsOpen});
                    }}
                    key="collaborators" open={collaboratorsOpen}>
                <div style={{marginLeft: '1rem'}}>
                  <GravatarGroup users={presencesOrdered} gravatarClassName={classes.smallGravatar} 
                    onClick={(event, presence) => recordPresenceToggle(event, presence)}/>
                </div>
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
                    <Sidebar width="8rem">
                      <ProMenu rootStyles={{'.ps-menu-button': {height: '30px'}}}>
                        {_.isEmpty(presenceMenuGroups) && (
                          <div style={{marginLeft: '10px', fontWeight: 'bold', marginTop: '8px'}}>
                            {intl.formatMessage({ id: 'noViews' })}
                          </div>
                        )}
                        {!_.isEmpty(presenceMenuGroups) && (
                          <div style={{marginLeft: '10px', fontWeight: 'bold', marginTop: '8px'}}>
                            {intl.formatMessage({ id: 'viewInGroup' })}
                          </div>
                        )}
                        {presenceMenuGroupsOrdered.map((group, index) => {
                          return <MenuItem key={`view${index}Key`} id={`view${index}Id`}
                                            rootStyles={{
                                              '.css-wx7wi4': {
                                                marginRight: 0,
                                              },
                                            }}
                                            onClick={()=> {
                                              recordPresenceToggle();
                                              navigate(history, formMarketLink(defaultMarket.id, group.id));
                                            }}>
                            {group.name}
                          </MenuItem>
                        })}
                      </ProMenu>
                    </Sidebar>
                  </Menu>
                )}
                <MenuItem icon={<AddIcon htmlColor="black" style={{fontSize: '1rem', marginBottom: '0.15rem'}} />}
                      key="addCollaboratorsKey" id="Addcollaborators"
                      rootStyles={{
                        '.css-wx7wi4': {
                          marginRight: 0,
                        }
                      }}
                      onClick={(event)=> {
                        preventDefaultAndProp(event);
                        navigate(history, `/wizard#type=${ADD_COLLABORATOR_WIZARD_TYPE.toLowerCase()}&marketId=${defaultMarket.id}`);
                      }}
                >
                  <Tooltip title={intl.formatMessage({ id: 'addMoreCollaborators' })}>
                    <div>
                      {intl.formatMessage({ id: 'dialogAddParticipantsLabel' })}
                    </div>
                  </Tooltip>
                </MenuItem>
            </SubMenu>
            <div style={{height: '10px'}} />
            <SubMenu id='integrations'
                    label={intl.formatMessage({ id: 'integrationPreferencesHeader' })}
                    onMouseOver={hideShowExpandIcon('integrations', true)}
                    onMouseOut={hideShowExpandIcon('integrations', false)}
                    rootStyles={{
                      '.css-18unl23': {
                        backgroundColor: '#DFF0F2'
                      },
                      '.css-nx2aea': {
                        backgroundColor: '#DFF0F2'
                      }
                    }}
                    onClick={(event) => {
                      preventDefaultAndProp(event);
                      updatePageState({integrationsOpen: !integrationsOpen});
                    }}
                    key="integrations" open={integrationsOpen}>
              <MenuItem icon={<Face htmlColor="black" style={{fontSize: '1rem', marginBottom: '0.15rem'}} />}
                      key="gravatarIntegrationKey" id="gravatarIntegrationId"
                      rootStyles={{
                        '.css-wx7wi4': {
                          marginRight: 0,
                        }
                      }}
                      onClick={(event) => {
                        preventDefaultAndProp(event);
                        navigate(history,`/integrationPreferences/${defaultMarket?.id}?integrationType=gravatar`);
                      }}
              >
                <Tooltip title={intl.formatMessage({ id: 'IdentityChangeAvatar' })}>
                  <div>
                    {intl.formatMessage({ id: 'changeAvatarPreferences' })}
                  </div>
                </Tooltip>
              </MenuItem>
              <MenuItem icon={<VpnKey htmlColor="black" style={{fontSize: '1rem', marginBottom: '0.15rem'}} />}
                      key="cliIntegrationKey" id="cliIntegrationId"
                      rootStyles={{
                        '.css-wx7wi4': {
                          marginRight: 0,
                        }
                      }}
                      onClick={(event) => {
                        preventDefaultAndProp(event);
                        navigate(history,`/integrationPreferences/${defaultMarket?.id}?groupId=${chosenGroup}&integrationType=cli`);
                      }}
              >
                <Tooltip title={intl.formatMessage({ id: 'integrationPreferencesHeader' })}>
                  <div>
                    {intl.formatMessage({ id: 'cliIntegration' })}
                  </div>
                </Tooltip>
              </MenuItem>
            {slackAddressable && (
              <MenuItem icon={<AddAlert htmlColor="black" style={{fontSize: '1rem', marginBottom: '0.15rem'}} />}
                        key="slackIntegrationKey" id="slackIntegrationId"
                        rootStyles={{
                          '.css-wx7wi4': {
                            marginRight: 0,
                          },
                        }}
                        onClick={(event) => {
                          preventDefaultAndProp(event);
                          navigate(history,'/integrationPreferences?integrationType=slack');
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
          </SubMenu>
          <div style={{height: '10px'}} />
          <SubMenu id='switchWorkspace' label={intl.formatMessage({ id: 'switchWorkspace' })}
                    rootStyles={{
                      '.css-ewdv3l': {
                        backgroundColor: '#DFF0F2'
                      },
                      '.css-nx2aea': {
                        backgroundColor: '#DFF0F2'
                      }
                    }}
                    onMouseOver={hideShowExpandIcon('switchWorkspace', true)}
                    onMouseOut={hideShowExpandIcon('switchWorkspace', false)}
                    onClick={(event) => {
                      preventDefaultAndProp(event);
                      updatePageState({switchWorkspaceOpen: !switchWorkspaceOpen});
                    }}
                    key="switchWorkspace" open={switchWorkspaceOpen}>
            {activeMarkets.map((market) => {
              const key = `market${market.id}`;

              if (market.id === defaultMarket.id) {
                return <React.Fragment key={key}/>;
              }
              return <MenuItem
                icon={<AgilePlanIcon htmlColor="black" style={{fontSize: '1rem', marginBottom: '0.15rem'}} />}
                id={key}
                key={key}
                rootStyles={{
                  '.css-wx7wi4': {
                    marginRight: 0,
                  },
                }}
                onClick={(event) => {
                  preventDefaultAndProp(event);
                  setChosenMarketId(market.id);
                }}
              >
                {market.name}
              </MenuItem>
            })}
            <MenuItem icon={<AddIcon htmlColor="black" style={{fontSize: '1rem', marginBottom: '0.15rem'}} />}
                      key="addWorkspace Key" id="addWorkspaceIconId"
                      rootStyles={{
                        '.css-wx7wi4': {
                          marginRight: 0,
                        },
                      }}
                      onClick={(event)=> {
                        preventDefaultAndProp(event);
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
      </Sidebar>
    </div>
  );
}

export default OtherWorkspaceMenus;
