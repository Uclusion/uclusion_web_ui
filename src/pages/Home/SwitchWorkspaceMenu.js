import React, { useContext, useState } from 'react';
import { Tooltip } from '@material-ui/core';
import { Menu as ProMenu, MenuItem, ProSidebar, SidebarContent, SubMenu } from 'react-pro-sidebar';
import { useHistory } from 'react-router';
import _ from 'lodash';
import { useIntl } from 'react-intl';
import AgilePlanIcon from '@material-ui/icons/PlaylistAdd';
import AddIcon from '@material-ui/icons/Add';
import { navigate } from '../../utils/marketIdPathFunctions';
import { WORKSPACE_WIZARD_TYPE } from '../../constants/markets';
import { AccountContext } from '../../contexts/AccountContext/AccountContext';
import { AddAlert, VpnKey } from '@material-ui/icons';
import config from '../../config';

function SwitchWorkspaceMenu(props) {
  const { markets: unfilteredMarkets, defaultMarket, setChosenMarketId, chosenGroup } = props;
  const [userState] = useContext(AccountContext) || {};
  const markets = unfilteredMarkets.filter((market) => !market.is_banned);
  const notCurrentMarkets = markets.filter((market) => market.id !== defaultMarket?.id);
  const activeMarkets = notCurrentMarkets.filter((market) => market.market_stage === 'Active');
  const intl = useIntl();
  const [switchWorkspaceOpen, setSwitchWorkspaceOpen] = useState(false);
  const [integrationsOpen, setIntegrationsOpen] = useState(false);
  const history = useHistory();
  const { user } = userState;
  const notificationConfig = user?.notification_configs?.find((config) =>
    config.market_id === defaultMarket?.id);
  const slackAddressable = notificationConfig?.is_slack_addressable;

  if (_.isEmpty(markets)||_.isEmpty(defaultMarket)) {
    return React.Fragment;
  }
  return (
    <div style={{marginLeft: '15px'}}>
      <ProSidebar width="14rem">
        <SidebarContent>
          <ProMenu iconShape="circle" style={{paddingBottom: 0, paddingTop: 0}}>
            <SubMenu style={{paddingBottom: '1rem'}} id='integrations'
                     title={intl.formatMessage({ id: 'integrationPreferencesHeader' })}
                     onClick={(event) => {
                       event.stopPropagation();
                       setIntegrationsOpen(!integrationsOpen);
                     }}
                     key="integrations" open={integrationsOpen}>
              <MenuItem icon={<VpnKey style={{fontSize: '1.3rem', paddingBottom: '2px'}} htmlColor="black" />}
                        key="integrationKey" id="integrationId"
                        onClick={() => {
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
            </SubMenu>
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

export default SwitchWorkspaceMenu;
