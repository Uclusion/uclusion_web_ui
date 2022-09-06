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
import { makeBreadCrumbs } from '../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import SpinBlockingButton from '../../components/SpinBlocking/SpinBlockingButton';
import SubSection from '../../containers/SubSection/SubSection';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'
import { Face } from '@material-ui/icons'
import Link from '@material-ui/core/Link'
import Gravatar from '../../components/Avatars/Gravatar'
import { AccountContext } from '../../contexts/AccountContext/AccountContext'
import { accountUserRefresh } from '../../contexts/AccountContext/accountContextReducer'

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
  const { user } = userState;
  const safeUser = user || {};
  const [emailEnabled, setEmailEnabled] = useState(undefined);
  const [slackEnabled, setSlackEnabled] = useState(undefined);
  const [slackDelay, setSlackDelay] = useState(undefined);
  const [emailDelay, setEmailDelay] = useState(undefined);
  const intl = useIntl();
  const classes = useStyles();

  const emailEnabledValue = emailEnabled === undefined ? safeUser.email_enabled : emailEnabled;

  function onSetEmailPreferences() {
    return updateUser({ emailEnabled: emailEnabledValue,
      emailDelay: emailDelay ? emailDelay*60 : emailDelay }).then((ret) =>{
      setOperationRunning(false);
      userDispatch(accountUserRefresh(ret.user));
      setEmailEnabled(undefined);
      setEmailDelay(undefined);
    });
  }

  const slackEnabledValue = slackEnabled === undefined ? safeUser.slack_enabled : slackEnabled;

  function onSetSlackPreferences() {
    return updateUser({ slackEnabled: slackEnabledValue, slackDelay }).then((ret) =>{
      setOperationRunning(false);
      userDispatch(accountUserRefresh(ret.user));
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

  const history = useHistory();
  const breadCrumbs = makeBreadCrumbs(history, [], true);
  const slackDelayDisabled = !safeUser.is_slack_addressable || !slackEnabledValue;
  return (
    <Screen
      title={intl.formatMessage({ id: 'changePreferencesHeader' })}
      tabTitle={intl.formatMessage({ id: 'changePreferencesHeader' })}
      hidden={hidden}
      breadCrumbs={breadCrumbs}
      loading={!user}
      hideMenu
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
                      value={!emailEnabledValue ? '' : (emailDelay || Math.round(safeUser.email_delay / 60) || 1)}
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
            {!safeUser.is_slack_addressable && (
              <ListItem>
              <a
                href={config.add_to_slack_url}
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
                      disabled={!safeUser.is_slack_addressable}
                      onClick={handleToggleSlack}
                    />
                  </ListItemIcon>
                  <ListItemText
                    className={safeUser.is_slack_addressable ? undefined : classes.disabled}
                  >
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
                      value={slackDelayDisabled ? '' : (slackDelay || safeUser.slack_delay || 30)}
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
    </Screen>
  );
}

ChangeNotificationPreferences.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default ChangeNotificationPreferences;
