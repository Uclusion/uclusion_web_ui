import React, { useContext, useState } from 'react';
import {
  Card,
  Checkbox,
  FormControl,
  Grid,
  ListItem,
  ListItemIcon,
  ListItemText,
  makeStyles,
  TextField, Typography,
} from '@material-ui/core'
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { updateUser } from '../../api/users';
import config from '../../config';
import Screen from '../../containers/Screen/Screen';
import SpinBlockingButton from '../../components/SpinBlocking/SpinBlockingButton';
import SubSection from '../../containers/SubSection/SubSection';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'
import { Face } from '@material-ui/icons'
import Link from '@material-ui/core/Link'
import Gravatar from '../../components/Avatars/Gravatar'
import { AccountContext } from '../../contexts/AccountContext/AccountContext'
import { accountUserRefresh } from '../../contexts/AccountContext/accountContextReducer'
import { getNotHiddenMarketDetailsForUser } from '../../contexts/MarketsContext/marketsContextHelper';
import { PLANNING_TYPE } from '../../constants/markets';
import _ from 'lodash';
import { getFirstWorkspace } from '../../utils/redirectUtils';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';

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
  const [userState, userDispatch] = useContext(AccountContext) || {};
  const [marketsState] = useContext(MarketsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const { user } = userState;
  const safeUser = user || {};
  const [emailEnabled, setEmailEnabled] = useState(undefined);
  const [slackEnabled, setSlackEnabled] = useState(undefined);
  const [slackDelay, setSlackDelay] = useState(undefined);
  const [emailDelay, setEmailDelay] = useState(undefined);
  const intl = useIntl();
  const classes = useStyles();
  const myNotHiddenMarketsState = getNotHiddenMarketDetailsForUser(marketsState, marketPresencesState);
  let markets = [];
  if (myNotHiddenMarketsState.marketDetails) {
    const filtered = myNotHiddenMarketsState.marketDetails.filter((market) =>
      market.market_type === PLANNING_TYPE);
    markets = _.sortBy(filtered, 'name');
  }
  const defaultMarket = getFirstWorkspace(markets, undefined) || {};
  const marketId = defaultMarket?.id;
  const notificationConfig = safeUser.notification_configs?.find((config) => config.market_id === marketId);
  const originalEmailEnabled = notificationConfig?.email_enabled === undefined ? true :
    notificationConfig?.email_enabled;
  const emailEnabledValue = emailEnabled === undefined ? originalEmailEnabled : emailEnabled;

  function onSetEmailPreferences() {
    return updateUser({ marketId, emailEnabled: emailEnabledValue,
      emailDelay: emailDelay ? emailDelay*60 : emailDelay }).then((user) =>{
      setOperationRunning(false);
      userDispatch(accountUserRefresh(user));
      setEmailEnabled(undefined);
      setEmailDelay(undefined);
    });
  }
  const originalSlackEnabled = notificationConfig?.slack_enabled === undefined ? true :
    notificationConfig?.slack_enabled;
  const slackEnabledValue = slackEnabled === undefined ? originalSlackEnabled : slackEnabled;

  function onSetSlackPreferences() {
    return updateUser({ marketId, slackEnabled: slackEnabledValue, slackDelay }).then((user) =>{
      setOperationRunning(false);
      userDispatch(accountUserRefresh(user));
      setSlackEnabled(undefined);
      setSlackDelay(undefined);
    });
  }

  function handleToggleEmail () {
    setEmailEnabled(!emailEnabledValue);
  }

  function handleToggleSlack () {
    setSlackEnabled(!slackEnabledValue);
  }

  function handleChangeSlackDelay (event) {
    const { value } = event.target;
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed)) {
      setSlackDelay(parsed);
    } else {
      setSlackDelay(undefined);
    }
  }

  function handleChangeEmailDelay (event) {
    const { value } = event.target;
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed)) {
      setEmailDelay(parsed);
    } else {
      setEmailDelay(undefined);
    }
  }
  const originalSlackAddressable = notificationConfig?.is_slack_addressable === undefined ? false :
    notificationConfig?.is_slack_addressable;
  const slackDelayDisabled = !originalSlackAddressable || !slackEnabledValue;
  const originalEmailDelay = notificationConfig?.email_delay === undefined ? 60 :
    notificationConfig?.email_delay;
  const originalSlackDelay = notificationConfig?.slack_delay === undefined ? 0 :
    notificationConfig?.slack_delay;
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
              justify="center"
              alignItems="baseline"
              style={{ paddingBottom: '0' }}
            >
              <ListItem
                key="avatarExplanation"
              >
                <Typography variant="body2">
                  Below is your current avatar image for <b>{safeUser.email}</b> provided by Gravatar. See <Link href="https://documentation.uclusion.com/getting-started/user-configuration/#setting-up-a-gravatar" target="_blank">user configuration</Link> for
                  more information.
                </Typography>
              </ListItem>
              <ListItem
                key="avatar"
              >
                <Gravatar className={classes.largeAvatar} email={safeUser.email}/>
              </ListItem>
              <Link href="https://www.gravatar.com"
                    target="_blank"
                    underline="none"
              >
                <ListItem key="avatarLink">
                  <Face style={{fontSize: 'medium', marginRight: 6}} />
                  <ListItemText className={classes.name}
                                primary={intl.formatMessage({ id: 'IdentityChangeAvatar' })} />
                </ListItem>
              </Link>
            </Grid>
          </SubSection>
        </Card>
      </div>
      {marketId && (
        <>
        <div className={classes.container} style={{marginTop: '3rem'}}>
        <Card>
          <SubSection
            title={intl.formatMessage({ id: 'changeEmailPreferences' })}
            padChildren
          >
            <Grid
              container
              direction="row"
              justify="center"
              alignItems="baseline"
              style={{ paddingBottom: '0' }}
            >
              <ListItem
                key="email"
              >
                <ListItemIcon>
                  <Checkbox
                    checked={emailEnabledValue}
                    onClick={handleToggleEmail}
                  />
                </ListItemIcon>
                <ListItemText>
                  {intl.formatMessage({ id: 'emailEnabledLabel' })}
                </ListItemText>
              </ListItem>
              <ListItem style={{paddingTop: 0, marginTop: 0}}>
                <FormControl fullWidth={true} margin="normal">
                  <TextField
                    id="emailDelay"
                    variant="outlined"
                    label={intl.formatMessage({ id: 'emailDelayInputLabel' })}
                    inputProps={{
                      className: classes.input,
                      inputMode: "numeric",
                      pattern: "[0-9]*"
                    }}
                    disabled={!emailEnabledValue}
                    onChange={handleChangeEmailDelay}
                    value={!emailEnabledValue ? '' : (emailDelay || Math.round(originalEmailDelay / 60) || 1)}
                  />
                </FormControl>
              </ListItem>
              <ListItem>
                <SpinBlockingButton
                  variant="outlined"
                  fullWidth={true}
                  id="changeEmailPreferences"
                  color="primary"
                  disabled={emailDelay === undefined && emailEnabled === undefined}
                  className={classes.actionPrimary}
                  onClick={onSetEmailPreferences}
                >
                  {intl.formatMessage({ id: 'changePreferencesButton' })}
                </SpinBlockingButton>
              </ListItem>
            </Grid>
          </SubSection>
        </Card>
        </div>
        <div className={classes.container} style={{marginTop: '3rem'}}>
        <Card>
          <SubSection
            title={intl.formatMessage({ id: 'changeSlackPreferences' })}
            padChildren
          >
            <Grid
              container
              direction="row"
              justify="center"
              alignItems="baseline"
              style={{ paddingBottom: '0' }}
            >
              {!originalSlackAddressable && (
                <ListItem>
                  <a
                    href={`${config.add_to_slack_url}&state=${safeUser.id}_${marketId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      alt="Add to Slack"
                      height="40"
                      width="139"
                      src="https://platform.slack-edge.com/img/add_to_slack.png"
                      srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x"
                    />
                  </a>
                </ListItem>
              )}
              <ListItem
                key="slack"
              >
                <ListItemIcon>
                  <Checkbox
                    checked={slackEnabledValue}
                    disabled={!originalSlackAddressable}
                    onClick={handleToggleSlack}
                  />
                </ListItemIcon>
                <ListItemText className={originalSlackAddressable ? undefined : classes.disabled}>
                  {intl.formatMessage({ id: 'slackEnabledLabel' })}
                </ListItemText>
              </ListItem>
              <ListItem style={{paddingTop: 0, marginTop: 0}}>
                <FormControl fullWidth={true} margin="normal">
                  <TextField
                    id="slackDelay"
                    disabled={slackDelayDisabled}
                    variant="outlined"
                    label={intl.formatMessage({ id: 'slackDelayInputLabel' })}
                    inputProps={{
                      className: classes.input,
                      inputMode: "numeric",
                      pattern: "[0-9]*"
                    }}
                    onChange={handleChangeSlackDelay}
                    value={slackDelayDisabled ? '' : (slackDelay || originalSlackDelay || 30)}
                  />
                </FormControl>
              </ListItem>
              <ListItem>
                <SpinBlockingButton
                  variant="outlined"
                  fullWidth={true}
                  id="changeSlackPreferences"
                  color="primary"
                  disabled={slackEnabled === undefined && slackDelay === undefined}
                  className={classes.actionPrimary}
                  onClick={onSetSlackPreferences}
                >
                  {intl.formatMessage({ id: 'changePreferencesButton' })}
                </SpinBlockingButton>
              </ListItem>
            </Grid>
          </SubSection>
        </Card>
      </div>
      </>
      )}
    </Screen>
  );
}

ChangeNotificationPreferences.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default ChangeNotificationPreferences;
