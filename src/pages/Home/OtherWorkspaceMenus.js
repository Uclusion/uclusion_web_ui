import React, { useContext, useEffect, useState } from 'react';
import { IconButton, makeStyles, Menu, Tooltip } from '@material-ui/core';
import { Menu as ProMenu, MenuItem, Sidebar, SubMenu } from 'react-pro-sidebar';
import { useHistory } from 'react-router';
import _ from 'lodash';
import queryString from 'query-string'
import { useIntl } from 'react-intl';
import AgilePlanIcon from '@material-ui/icons/PlaylistAdd';
import AddIcon from '@material-ui/icons/Add';
import { formMarketLink, navigate, preventDefaultAndProp } from '../../utils/marketIdPathFunctions';
import { ADD_COLLABORATOR_WIZARD_TYPE, DEMO_TYPE, SUPPORT_SUB_TYPE, WORKSPACE_WIZARD_TYPE } from '../../constants/markets';
import { AccountContext } from '../../contexts/AccountContext/AccountContext';
import { AddAlert, ExpandLess, ExpandMore, Face, Inbox, VpnKey } from '@material-ui/icons';
import config from '../../config';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { MarketGroupsContext } from '../../contexts/MarketGroupsContext/MarketGroupsContext';
import { GroupMembersContext } from '../../contexts/GroupMembersContext/GroupMembersContext';
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import { getPageReducerPage, usePageStateReducer } from '../../components/PageState/pageStateHooks';
import { hideShowExpandIcon } from '../../utils/windowUtils';
import GravatarGroup from '../../components/Avatars/GravatarGroup';
import { ACTION_BUTTON_COLOR, INFO_COLOR } from '../../components/Buttons/ButtonConstants';
import { getInboxCount, getInboxTarget, isInInbox } from '../../contexts/NotificationsContext/notificationsContextHelper';
import OutboxIcon from '../../components/CustomChip/Outbox';
import { SearchResultsContext } from '../../contexts/SearchResultsContext/SearchResultsContext';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';
import { getOutboxMessages } from './YourWork/InboxExpansionPanel';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import { useLocation } from 'react-router-dom/cjs/react-router-dom.min';
import NotificationCountChips from '../Dialog/NotificationCountChips';
import md5 from 'md5';
import { OnlineStateContext } from '../../contexts/OnlineStateContext';


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
  const { markets: unfilteredMarkets, defaultMarket, setChosenMarketId, chosenGroup, mobileLayout, action } = props;
  const location = useLocation();
  const { search: querySearch, hash } = location;
  const values = queryString.parse(querySearch);
  const { integrationType } = values || {};
  const hashValues = queryString.parse(hash);
  const { type } = hashValues || {};
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [groupsState] = useContext(MarketGroupsContext);
  const [groupPresencesState] = useContext(GroupMembersContext);
  const [userState] = useContext(AccountContext) || {};
  const [marketsState] = useContext(MarketsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [commentsState] = useContext(CommentsContext);
  const [messagesState] = useContext(NotificationsContext);
  const [searchResults] = useContext(SearchResultsContext);
  const [online] = useContext(OnlineStateContext);
  const [gravatarExists, setGravatarExists] = useState(undefined);
  const { search } = searchResults;
  const markets = unfilteredMarkets.filter((market) => !market.is_banned);
  const notCurrentMarkets = markets.filter((market) => market.id !== defaultMarket?.id);
  const activeMarkets = notCurrentMarkets.filter((market) => market.market_stage === 'Active');
  const activeFirstFiveMarkets = activeMarkets?.slice(0, 5);
  const activeMoreFiveMarkets = activeMarkets?.slice(5);
  const intl = useIntl();
  const [pageStateFull, pageDispatch] = usePageStateReducer('otherMenus');
  const [pageState, updatePageState] = getPageReducerPage(pageStateFull, pageDispatch, 'menuState',
    {switchWorkspaceOpen: true, messagesOpen: true});
  const [workspacePageState, updateWorkspacePageState] = getPageReducerPage(pageStateFull, pageDispatch, 
    defaultMarket?.id ||'menuState', {integrationsOpen: defaultMarket?.object_type !== DEMO_TYPE && 
      defaultMarket?.market_sub_type !== SUPPORT_SUB_TYPE, collaboratorsOpen: !mobileLayout});
  const { switchWorkspaceOpen, messagesOpen } = pageState;
  const { integrationsOpen } = workspacePageState;
  const [presenceAnchor, setPresenceAnchor] = useState(null);
  const [presenceMenuId, setPresenceMenuId] = useState(undefined);
  const history = useHistory();
  const classes = useStyles();
  const { user } = userState;
  const email = user?.email;
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

  useEffect(() => {
    if (online && gravatarExists === undefined && email) {
      const url = `https://www.gravatar.com/avatar/${md5(email, { encoding: 'binary' })}?d=404`;
      const http = new XMLHttpRequest();
      http.open('HEAD', url, true);
      http.onload = () => {
        setGravatarExists(http.status !== 404);
      };
      http.send();
    }
  }, [email, online, gravatarExists]);

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

  const { messages } = messagesState;
  const messagesFull = messages?.filter((message) => {
    return isInInbox(message);
  });
  const unreadCount = _.isEmpty(search) ? getInboxCount(messagesState) : 0;
  let num = undefined;
  let numSuffix = undefined;
  if (unreadCount > 0) {
    num = unreadCount;
    numSuffix = 'new';
  } else if (!_.isEmpty(messagesFull)) {
    num = messagesFull.length;
    numSuffix = 'total';
  }

  // Not going to be good performance for this - move to root and pass down as prop?
  const allOutBoxMessagesOrdered = getOutboxMessages({messagesState, marketsState, marketPresencesState,
    investiblesState, marketStagesState, commentsState, groupPresencesState, intl});
  const outboxCount = _.size(allOutBoxMessagesOrdered);

  return (
    <>
      <ProMenu 
        rootStyles={{'.ps-menu-button': {paddingLeft: '16px', height: '30px', overflow: 'hidden'}}}
        renderExpandIcon={() => <div onClick={(event)=> {
          preventDefaultAndProp(event);
          if (defaultMarket) {
            navigate(history, `/wizard#type=${ADD_COLLABORATOR_WIZARD_TYPE.toLowerCase()}&marketId=${defaultMarket.id}`);
          }
        }}><Tooltip placement='top' title={intl.formatMessage({ id: 'dialogAddParticipantsLabel' })}>
        <IconButton size="small" id="Addcollaborators">
        <AddIcon htmlColor={defaultMarket ? ACTION_BUTTON_COLOR : 'disabled'} fontSize="small" />
        </IconButton>
      </Tooltip></div>}>
          <SubMenu id='collaborators'
                  label={intl.formatMessage({ id: 'collaborators' })}
                  rootStyles={{
                    '.css-nx2aea': {
                      backgroundColor: INFO_COLOR
                    }
                  }}
                  style={{backgroundColor: (action === 'wizard' && type === ADD_COLLABORATOR_WIZARD_TYPE.toLowerCase()) ? '#e0e0e0' : undefined, borderRadius: 22}}
                  key="collaborators" open >
              <div style={{marginLeft: '2rem'}}>
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
          </SubMenu>
          </ProMenu>
          <div style={{marginBottom: '1rem', marginTop: '0.5rem'}} />
          <ProMenu 
        rootStyles={{'.ps-menu-button': {paddingLeft: '16px', height: '30px', overflow: 'hidden'}}}
        renderExpandIcon={({ open }) => open ? <ExpandLess htmlColor="#8f8f8f" style={{marginTop: '0.3rem', visibility: 'hidden'}} />
          : <ExpandMore htmlColor="#8f8f8f" style={{marginTop: '0.3rem', visibility: 'hidden'}} />}>
          <SubMenu id='messages'
            label={intl.formatMessage({ id: 'messages' })}
            onMouseOver={hideShowExpandIcon('messages', true)}
            onMouseOut={hideShowExpandIcon('messages', false)}
            rootStyles={{
              '.css-18unl23': {
                backgroundColor: INFO_COLOR
              },
              '.css-nx2aea': {
                backgroundColor: INFO_COLOR
              }
            }}
            onClick={(event) => {
              preventDefaultAndProp(event);
              updatePageState({messagesOpen: !messagesOpen});
            }}
            key="messagesKey" open={messagesOpen}>
            <MenuItem style={{backgroundColor: action === 'inbox' ? '#e0e0e0' : undefined, borderRadius: 22}}
              icon={<Inbox htmlColor="black" style={{fontSize: '1rem', marginBottom: '0.15rem'}} />}
                key="inboxKey" id="inboxId"
                rootStyles={{
                  '.css-wx7wi4': {
                    marginRight: 0,
                  }
                }}
                suffix={num > 0 ?
                  <NotificationCountChips num={num} numSuffix={numSuffix} />
                    : undefined}
                onClick={(event) => {
                  preventDefaultAndProp(event);
                  navigate(history,getInboxTarget());
                }}
            >
              <Tooltip title={intl.formatMessage({ id: 'forYouToolTip' })}>
                <div>
                  {intl.formatMessage({ id: 'unread' })}
                </div>
              </Tooltip>
            </MenuItem>
            <MenuItem style={{backgroundColor: action === 'outbox' ? '#e0e0e0' : undefined, borderRadius: 22}}
             icon={<OutboxIcon htmlColor="black" style={{fontSize: '1rem', marginBottom: '0.15rem'}} />}
                    key="outboxKey" id="outboxId"
                    rootStyles={{
                      '.css-wx7wi4': {
                        marginRight: 0,
                      }
                    }}
                    suffix={outboxCount > 0 ?
                      <NotificationCountChips num={outboxCount} numSuffix='total' /> : undefined}
                    onClick={(event) => {
                      preventDefaultAndProp(event);
                      navigate(history, '/outbox');
                    }}
            >
              <Tooltip title={intl.formatMessage({ id: 'fromYouToolTip' })}>
                <div>
                  {intl.formatMessage({ id: 'outbox' })}
                </div>
              </Tooltip>
            </MenuItem>
        </SubMenu>
          <div style={{marginBottom: '1rem'}} />
          <SubMenu id='integrations'
                  label={intl.formatMessage({ id: 'integrationPreferencesHeader' })}
                  onMouseOver={hideShowExpandIcon('integrations', true)}
                  onMouseOut={hideShowExpandIcon('integrations', false)}
                  rootStyles={{
                    '.css-18unl23': {
                      backgroundColor: INFO_COLOR
                    },
                    '.css-nx2aea': {
                      backgroundColor: INFO_COLOR
                    }
                  }}
                  onClick={(event) => {
                    preventDefaultAndProp(event);
                    updateWorkspacePageState({integrationsOpen: !integrationsOpen});
                  }}
                  key="integrations" open={integrationsOpen}>
            {gravatarExists === false && (
              <MenuItem icon={<Face htmlColor="black" style={{fontSize: '1rem', marginBottom: '0.15rem'}} />}
                      key="gravatarIntegrationKey" id="gravatarIntegrationId"
                      rootStyles={{
                        '.css-wx7wi4': {
                          marginRight: 0,
                        }
                      }}
                      style={{backgroundColor: (action === 'integrationPreferences' && integrationType === 'gravatar') ? '#e0e0e0' : undefined, 
                        borderRadius: 22}}
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
            )}
            <MenuItem icon={<VpnKey htmlColor="black" style={{fontSize: '1rem', marginBottom: '0.15rem'}} />}
                    key="cliIntegrationKey" id="cliIntegrationId"
                    rootStyles={{
                      '.css-wx7wi4': {
                        marginRight: 0,
                      }
                    }}
                    style={{backgroundColor: (action === 'integrationPreferences' && integrationType === 'cli') ? '#e0e0e0' : undefined, 
                      borderRadius: 22}}
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
                      style={{backgroundColor: (action === 'integrationPreferences' && integrationType === 'slack') ? '#e0e0e0' : undefined, 
                        borderRadius: 22}}
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
        </ProMenu>
        <div style={{height: '10px'}} />
        <ProMenu rootStyles={{'.ps-menu-button': {paddingLeft: '16px', height: '30px', overflow: 'hidden'}}}
        renderExpandIcon={() => <div onClick={(event)=> {
          preventDefaultAndProp(event);
          navigate(history, `/wizard#type=${WORKSPACE_WIZARD_TYPE.toLowerCase()}`);
        }}><Tooltip placement='top' title={intl.formatMessage({ id: 'homeAddPlanning' })}>
        <IconButton size="small" id="createWorkspaceId">
        <AddIcon htmlColor={defaultMarket ? ACTION_BUTTON_COLOR : 'disabled'} fontSize="small" />
        </IconButton>
      </Tooltip></div>}
        onClick={(event) => {
          preventDefaultAndProp(event);
          updatePageState({switchWorkspaceOpen: !switchWorkspaceOpen});
        }}
        >
        <SubMenu id='switchWorkspace' label={intl.formatMessage({ id: 'switchWorkspace' })}
                  rootStyles={{
                    '.css-ewdv3l': {
                      backgroundColor: INFO_COLOR
                    },
                    '.css-nx2aea': {
                      backgroundColor: INFO_COLOR
                    }
                  }}
                  style={{backgroundColor: (action === 'wizard' && type === WORKSPACE_WIZARD_TYPE.toLowerCase()) ? '#e0e0e0' : undefined, 
                    borderRadius: 22}}
                  key="switchWorkspace" open >
          {activeFirstFiveMarkets.map((market) => {
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
          {activeMarkets.length > 5 && (
            <MenuItem
              icon={switchWorkspaceOpen ? <ExpandLess htmlColor="black" style={{fontSize: '1rem', marginBottom: '0.15rem'}} /> 
              : <ExpandMore htmlColor="black" style={{fontSize: '1rem', marginBottom: '0.15rem'}} />}
              id="moreMarketsId"
              key="moreMarketsKey"
              onClick={(event) => {
                preventDefaultAndProp(event);
                updatePageState({switchWorkspaceOpen: !switchWorkspaceOpen});
              }}
            >
              {intl.formatMessage({ id: switchWorkspaceOpen ? 'less' : 'more' })}
            </MenuItem>
          )}
          {switchWorkspaceOpen && activeMoreFiveMarkets.map((market) => {
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
        </SubMenu>
      </ProMenu>
      </>
  );
}

export default OtherWorkspaceMenus;
