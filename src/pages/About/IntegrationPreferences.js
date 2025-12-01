import React, { useContext, useState } from 'react';
import { Card, FormControl, Grid, ListItem, makeStyles, MenuItem, Select, Typography, } from '@material-ui/core';
import { FormattedMessage, useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import config from '../../config';
import Screen from '../../containers/Screen/Screen';
import SubSection from '../../containers/SubSection/SubSection';
import { Face } from '@material-ui/icons';
import Link from '@material-ui/core/Link';
import Gravatar from '../../components/Avatars/Gravatar';
import { AccountContext } from '../../contexts/AccountContext/AccountContext';
import { getNotHiddenMarketDetailsForUser, getSortedMarkets } from '../../contexts/MarketsContext/marketsContextHelper';
import { PLANNING_TYPE } from '../../constants/markets';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { decomposeMarketPath } from '../../utils/marketIdPathFunctions';
import { useLocation } from 'react-router';
import queryString from 'query-string';
import CLISecret from './CLISecret';
import CLIScript from '../../components/Scripts/uclusionCLI.py';
import { MarketGroupsContext } from '../../contexts/MarketGroupsContext/MarketGroupsContext';
import _ from 'lodash';

const useStyles = makeStyles((theme) => ({
  disabled: {
    color: theme.palette.text.disabled,
  },
  container: {
    maxWidth: '600px',
    display: 'block',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  containerLarge: {
    maxWidth: '800px',
    display: 'block',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  action: {
    boxShadow: 'none',
    padding: '4px 16px',
    textTransform: 'none',
    '&:hover': {
      boxShadow: 'none'
    }
  },
  actionPrimary: {
    backgroundColor: '#2D9CDB',
    color: 'white',
    textTransform: 'unset',
    '&:hover': {
      backgroundColor: '#e0e0e0'
    },
    '&:disabled': {
      color: 'white',
      backgroundColor: 'rgba(45, 156, 219, .6)'
    }
  },
  input: { textAlign: "center", padding: '10px' },
  largeAvatar: {
    width: theme.spacing(8),
    height: theme.spacing(8),
    display: 'block',
    marginLeft: 'auto',
    marginRight: 'auto',
    fontSize: theme.spacing(4),
  }
}));

function IntegrationPreferences (props) {
  const { hidden } = props;
  const intl = useIntl();
  const classes = useStyles();
  const [userState] = useContext(AccountContext);
  const [marketsState] = useContext(MarketsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [groupsState] = useContext(MarketGroupsContext);
  const location = useLocation();
  const { pathname, search: querySearch } = location;
  const { marketId } = decomposeMarketPath(pathname);
  const [groupId, setGroupId] = useState(marketId);
  const values = queryString.parse(querySearch);
  const { integrationType } = values || {};
  const { user } = userState || {};
  const myNotHiddenMarketsState = getNotHiddenMarketDetailsForUser(marketsState, marketPresencesState);
  let markets = [];
  const allowableGroups = groupsState[marketId];

  if (myNotHiddenMarketsState.marketDetails) {
    const filtered = myNotHiddenMarketsState.marketDetails.filter((market) =>
      market.market_type === PLANNING_TYPE);
    markets = getSortedMarkets(filtered);
  }

  // DONE B-all-339 Have drop down for view selection.

  return (
    <Screen
      title={intl.formatMessage({ id: 'integrationPreferencesHeader' })}
      tabTitle={intl.formatMessage({ id: 'integrationPreferencesHeader' })}
      hidden={hidden}
      loading={!user}
    >
      {(integrationType === undefined || integrationType === 'gravatar') && (
        <div className={classes.container} style={{marginTop: '3rem', marginBottom: '1rem'}}>
          <Card>
            <SubSection
              title={intl.formatMessage({ id: 'changeAvatarPreferences' })}
              padChildren
            >
              <Grid
                container
                direction="row"
                alignItems="baseline"
                style={{ paddingBottom: '0' }}
              >
                <ListItem
                  key="avatarExplanation"
                >
                  <Typography variant="body2">
                    Below is your current avatar image for <b>{user?.email}</b> provided by Gravatar. See <Link href="https://documentation.uclusion.com/getting-started/user-configuration/#setting-up-a-gravatar" target="_blank">user configuration</Link> for
                    more information.
                  </Typography>
                </ListItem>
                <ListItem
                  key="avatar"
                >
                  <Gravatar className={classes.largeAvatar} email={user?.email}/>
                </ListItem>
                <ListItem>
                  <Link href="https://www.gravatar.com"
                        target="_blank"
                        key="avatarLinkLink"
                        underline="none"
                        style={{display: 'flex'}}
                  >
                    <Face style={{fontSize: 'medium', marginRight: 6}} />
                    <div className={classes.name}>{intl.formatMessage({ id: 'IdentityChangeAvatar' })}</div>
                  </Link>
                </ListItem>
              </Grid>
            </SubSection>
          </Card>
        </div>
      )}
      {(integrationType === undefined || integrationType === 'slack') && (
        <div className={classes.container} style={{marginTop: '3rem', marginBottom: '1rem'}}>
          <Card>
            <SubSection
              title={intl.formatMessage({ id: 'slackIntegration' })}
              padChildren
            >
              {markets.map((market) => {
                const marketId = market.id;
                const notificationConfig = user?.notification_configs?.find((config) =>
                  config.market_id === marketId);
                const slackAddressable = notificationConfig?.is_slack_addressable;
                return (
                <Grid
                  container
                  key="preferencesGrid"
                  direction="row"
                  alignItems="baseline"
                  style={{ paddingBottom: '0' }}
                >
                  <ListItem key={`slackLink${marketId}`}>
                    <Typography style={{paddingRight: '2rem'}}>
                      Workspace <b>{market.name}</b>
                    </Typography>
                    <a
                      href={`${config.add_to_slack_url}&state=${user?.id}_${marketId}`}
                      rel="noopener noreferrer"
                    >
                      {slackAddressable && (
                        <div style={{display: 'flex', alignItems: 'center'}}>
                          <svg xmlns="http://www.w3.org/2000/svg" style={{height: '24px', width: '24px', marginRight: '10px'}}
                              viewBox="0 0 122.8 122.8"><path d="M25.8 77.6c0 7.1-5.8 12.9-12.9 12.9S0 84.7 0 77.6s5.8-12.9 12.9-12.9h12.9v12.9zm6.5 0c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9v32.3c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V77.6z" fill="#e01e5a"></path><path d="M45.2 25.8c-7.1 0-12.9-5.8-12.9-12.9S38.1 0 45.2 0s12.9 5.8 12.9 12.9v12.9H45.2zm0 6.5c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H12.9C5.8 58.1 0 52.3 0 45.2s5.8-12.9 12.9-12.9h32.3z" fill="#36c5f0"></path><path d="M97 45.2c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9H97V45.2zm-6.5 0c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V12.9C64.7 5.8 70.5 0 77.6 0s12.9 5.8 12.9 12.9v32.3z" fill="#2eb67d"></path><path d="M77.6 97c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9-12.9-5.8-12.9-12.9V97h12.9zm0-6.5c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9h32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H77.6z" fill="#ecb22e"></path></svg>
                          Reinstall Slack integration.
                        </div>
                      )}
                      {!slackAddressable && (
                        <img
                          alt="Add to Slack"
                          height="40"
                          width="139"
                          src="https://platform.slack-edge.com/img/add_to_slack.png"
                          srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x"
                        />
                      )}
                    </a>
                  </ListItem>
                </Grid>);
              })}
            </SubSection>
          </Card>
        </div>
      )}
      {(integrationType === undefined || integrationType === 'cli') && (
        <div className={classes.containerLarge} style={{marginTop: '3rem', marginBottom: '10rem'}}>
          {_.size(allowableGroups) > 1 && groupId && (
            <>
              <div>
                <FormattedMessage id="switchTodoView"/>
              </div>
              <FormControl style={{marginBottom: '1rem'}}>
                  <Select
                    value={groupId}
                    onChange={(event) => setGroupId(event.target.value)}
                  >
                    {allowableGroups.map((group) => {
                      return <MenuItem key={`key${group.id}`} value={group.id}>{group.name}</MenuItem>
                    })}
                  </Select>
              </FormControl>
            </>
          )}
          <Card>
            <SubSection
              title={intl.formatMessage({ id: 'cliIntegration' })}
              padChildren
            >
              <Typography variant="subtitle1" style={{paddingBottom: '1rem'}}>
                See <Link href="https://documentation.uclusion.com/cli" target="_blank">CLI</Link> documentation.
                Example uclusion.json for this workspace:
              </Typography>
              <p style={{whiteSpace: 'pre-wrap'}}>
                {"{"}<br/>
                {'   "workspaceId": "'+marketId+'",'}<br/>
                {'   "todoViewId": "'+groupId+'",'}<br/>
                {'   "extensionsList": ['}<br/>
                {'     "java",'}<br/>
                {'     "js",'}<br/>
                {'     "py"'}<br/>
                {"   ],"}<br/>
                {'   "sourcesList": ['}<br/>
                {'     "./src",'}<br/>
                {'     "./src2"'}<br/>
                {"   ],"}<br/>
                {'   "uclusionMDFileType": "report",'}<br/>
                {'   "uclusionMDFilePath": "uclusion.md"'}<br/>
                {"}"}
              </p>
              <CLISecret marketId={marketId} />
              <Typography variant="subtitle1" style={{marginTop: '2rem', marginBottom: '0.5rem'}}>
                Download the CLI Python script by clicking below:
              </Typography>
              <a href={CLIScript} download='uclusionCLI.py' >CLI Script</a>
            </SubSection>
          </Card>
        </div>
      )}
    </Screen>
  );
}

IntegrationPreferences.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default IntegrationPreferences;
