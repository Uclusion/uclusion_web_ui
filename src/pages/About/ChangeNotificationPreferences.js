import React, { useContext, useReducer, useState } from 'react';
import {
  Card,
  Checkbox, FormControl,
  Grid,
  ListItem,
  ListItemIcon,
  ListItemText,
  makeStyles, MenuItem,
  Select,
  Typography,
} from '@material-ui/core';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { updateUser } from '../../api/users';
import config from '../../config';
import Screen from '../../containers/Screen/Screen';
import SpinBlockingButton from '../../components/SpinBlocking/SpinBlockingButton';
import SubSection from '../../containers/SubSection/SubSection';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';
import { Face } from '@material-ui/icons';
import Link from '@material-ui/core/Link';
import Gravatar from '../../components/Avatars/Gravatar';
import { AccountContext } from '../../contexts/AccountContext/AccountContext';
import { accountUserRefresh } from '../../contexts/AccountContext/accountContextReducer';
import { getNotHiddenMarketDetailsForUser } from '../../contexts/MarketsContext/marketsContextHelper';
import { PLANNING_TYPE, SUPPORT_SUB_TYPE } from '../../constants/markets';
import _ from 'lodash';
import { getFirstWorkspace } from '../../utils/redirectUtils';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import NotificationDelay from './NotificationDelay';
import InputLabel from '@material-ui/core/InputLabel';

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

function ChangeNotificationPreferences (props) {
  const { hidden } = props;
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [userState, userDispatch] = useContext(AccountContext);
  const [marketsState] = useContext(MarketsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const { user } = userState || {};
  const myNotHiddenMarketsState = getNotHiddenMarketDetailsForUser(marketsState, marketPresencesState);
  let markets = [];
  if (myNotHiddenMarketsState.marketDetails) {
    const filtered = myNotHiddenMarketsState.marketDetails.filter((market) =>
      market.market_type === PLANNING_TYPE);
    markets = _.sortBy(filtered, (market) => market.market_sub_type === SUPPORT_SUB_TYPE, 'name');
  }
  const [chosenMarketId, setChosenMarketId] = useState(undefined);
  const defaultMarket = getFirstWorkspace(markets, chosenMarketId);
  const marketId = defaultMarket?.id;
  const [marketConfigs, marketConfigsDispatch] = useReducer((state, action) => {
    if (action.type === 'clearMarketId') {
      return _.omit(state, [marketId]);
    }
    const { value } = action;
    const marketConfig = state[marketId] || {};
    marketConfig[action.type] = value;
    if (action.type.startsWith('slack')) {
      marketConfig.slackValuesChanged = true;
    }
    if (action.type.startsWith('email')) {
      marketConfig.emailValuesChanged = true;
    }
    return { ...state, [marketId]: marketConfig };
  }, {});
  const intl = useIntl();
  const classes = useStyles();
  const notificationConfig = user?.notification_configs?.find((config) => config.market_id === marketId);
  const { emailDelay, emailDelayYellow, emailEnabled, slackEnabled, slackDelay, emailValuesChanged,
    slackValuesChanged } = marketConfigs[marketId] || {};
  const slackEnabledValue = slackEnabled !== undefined ? slackEnabled :
    (notificationConfig?.slack_enabled !== undefined ? notificationConfig?.slack_enabled : true);
  const emailEnabledValue = emailEnabled !== undefined ? emailEnabled :
    (notificationConfig?.email_enabled !== undefined ? notificationConfig?.email_enabled : true);
  const emailDelayValue = emailDelay !== undefined ? emailDelay :
    (notificationConfig?.email_delay !== undefined ? notificationConfig?.email_delay : 30);
  const emailDelayYellowValue = emailDelayYellow !== undefined ? emailDelayYellow :
    (notificationConfig?.email_delay_yellow !== undefined ? notificationConfig?.email_delay_yellow : 90);
  const slackDelayValue = slackDelay !== undefined ? slackDelay :
    (notificationConfig?.slack_delay !== undefined ? notificationConfig?.slack_delay : 30);

  function onSetPreferences() {
    return updateUser({ marketId, emailEnabled: emailEnabledValue, slackEnabled: slackEnabledValue,
      emailDelay: emailDelayValue, emailDelayYellow: emailDelayYellowValue, slackDelay: slackDelayValue })
      .then((user) =>{
        setOperationRunning(false);
        userDispatch(accountUserRefresh(user));
        marketConfigsDispatch({type: 'clearMarketId'});
    });
  }

  const slackAddressable = notificationConfig?.is_slack_addressable;
  const slackDelayDisabled = !slackAddressable || !slackEnabledValue;

  return (
    <Screen
      title={intl.formatMessage({ id: 'changePreferencesHeader' })}
      tabTitle={intl.formatMessage({ id: 'changePreferencesHeader' })}
      hidden={hidden}
      loading={!user}
    >
      <div className={classes.container}>
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
      <div className={classes.container} style={{marginTop: '3rem', marginBottom: '1rem'}}>
        <Card>
          <SubSection
            title={intl.formatMessage({ id: 'changePreferences' })}
            padChildren
          >
            <Grid
              container
              key="preferencesGrid"
              direction="row"
              alignItems="baseline"
              style={{ paddingBottom: '0' }}
            >
              <ListItem key="workspace">
                <FormControl variant="filled">
                  <InputLabel id="markets">
                    {intl.formatMessage({ id: 'switchWorkspace' })}
                  </InputLabel>
                  {marketId && (
                    <Select
                      value={marketId}
                      onChange={(event) => setChosenMarketId(event.target.value)}
                      style={{backgroundColor: "#ecf0f1"}}
                    >
                      {markets.map((market) => {
                        return <MenuItem key={`key${market.id}`} value={market.id}>{market.name}</MenuItem>
                      })}
                    </Select>
                  )}
                  <Typography>
                    {intl.formatMessage({ id: 'notificationMarketSettingsExplanation' })}
                  </Typography>
                </FormControl>
              </ListItem>
              <ListItem
                key="email"
              >
                <ListItemIcon>
                  <Checkbox
                    checked={emailEnabledValue}
                    onClick={() => marketConfigsDispatch({type: 'emailEnabled', value: !emailEnabled})}
                  />
                </ListItemIcon>
                <ListItemText>
                  {intl.formatMessage({ id: 'emailEnabledLabel' })}
                </ListItemText>
              </ListItem>
              <ListItem key="emailDelay" style={{paddingTop: 0, marginTop: 0}}>
                <NotificationDelay
                  disabled={!emailEnabledValue}
                  onChange={(event) => marketConfigsDispatch({type: 'emailDelay', value: event.target.value})}
                  value={emailDelayValue}
                  explanationId="emailDelayExplanation" labelId="emailDelayInputLabel"
                />
              </ListItem>
              <ListItem key="emailDelayYellow" style={{marginTop: '1rem'}}>
                <NotificationDelay
                  disabled={!emailEnabledValue}
                  onChange={(event) =>
                    marketConfigsDispatch({type: 'emailDelayYellow', value: event.target.value})}
                  value={emailDelayYellowValue}
                  explanationId="emailDelayYellowExplanation" labelId="emailDelayYellowInputLabel"
                />
              </ListItem>
              <ListItem key="slackLink" style={{marginTop: '1rem'}}>
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
              <ListItem
                key="slack"
              >
                <ListItemIcon>
                  <Checkbox
                    checked={slackEnabledValue}
                    disabled={!slackAddressable}
                    onClick={() => marketConfigsDispatch({type: 'slackEnabled', value: !slackEnabled})}
                  />
                </ListItemIcon>
                <ListItemText className={slackAddressable ? undefined : classes.disabled}>
                  {intl.formatMessage({ id: 'slackEnabledLabel' })}
                </ListItemText>
              </ListItem>
              <ListItem key="slackDelay" style={{paddingTop: 0, marginTop: 0}}>
                <NotificationDelay
                  disabled={slackDelayDisabled}
                  onChange={(event) => marketConfigsDispatch({type: 'slackDelay', value: event.target.value})}
                  value={slackDelayValue}
                  explanationId="slackDelayExplanation" labelId="slackDelayInputLabel"/>
              </ListItem>
              <ListItem key="changePreferences" style={{marginTop: '1rem'}}>
                <SpinBlockingButton
                  variant="outlined"
                  fullWidth={true}
                  id="changeEmailPreferences"
                  color="primary"
                  disabled={!emailValuesChanged && !slackValuesChanged}
                  className={classes.actionPrimary}
                  onClick={onSetPreferences}
                >
                  {intl.formatMessage({ id: 'changePreferencesButton' })}
                </SpinBlockingButton>
              </ListItem>
            </Grid>
          </SubSection>
        </Card>
      </div>
    </Screen>
  );
}

ChangeNotificationPreferences.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default ChangeNotificationPreferences;
