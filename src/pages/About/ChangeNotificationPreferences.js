import React, { useEffect, useState } from 'react';
import {
  Button,
  Checkbox, ListItem,
  ListItemIcon,
  ListItemText, makeStyles, TextField,
  Typography,
} from '@material-ui/core'
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { updateUser } from '../../api/users';
import config from '../../config';
import { getSSOInfo } from '../../api/sso';
import { toastErrorAndThrow } from '../../utils/userMessage';
import Screen from '../../containers/Screen/Screen'
import { makeBreadCrumbs } from '../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'

const useStyles = makeStyles((theme) => ({
  name: {},
  disabled: {
    color: theme.palette.text.disabled,
  },
}));

function ChangeNotificationPreferences(props) {
  const { hidden } = props;
  const [emailEnabled, setEmailEnabled] = useState(undefined);
  const [slackEnabled, setSlackEnabled] = useState(undefined);
  const [user, setUser] = useState(undefined);
  const [slackDelay, setSlackDelay] = useState(30);
  const [emailDelay, setEmailDelay] = useState(30);
  const intl = useIntl();
  const classes = useStyles();

  useEffect(() => {
    if (!hidden && user === undefined) {
      getSSOInfo().then((ssoInfo) => {
        const { idToken, ssoClient } = ssoInfo;
        return ssoClient.accountCognitoLogin(idToken).then((loginInfo) => {
          const { user: myUser } = loginInfo;
          setEmailEnabled(myUser.email_enabled);
          setSlackEnabled(myUser.slack_enabled);
          setEmailDelay(myUser.email_delay)
          if (myUser.slack_delay) {
            setSlackDelay(myUser.slack_delay);
          }
          setUser(myUser);
        });
      }).catch((error) => toastErrorAndThrow(error, 'errorGetIdFailed'));
    }
  }, [user, hidden]);

  function onSetPreferences() {
    updateUser({ emailEnabled, slackEnabled, slackDelay, emailDelay });
  }

  function handleToggleEmail() {
    setEmailEnabled(!emailEnabled);
  }

  function handleToggleSlack() {
    setSlackEnabled(!slackEnabled);
  }

  function handleChangeSlackDelay(event) {
    const { value } = event.target;
    setSlackDelay(parseInt(value, 10));
  }

  function handleChangeEmailDelay(event) {
    const { value } = event.target;
    setEmailDelay(parseInt(value, 10));
  }

  const history = useHistory();
  const breadCrumbs = makeBreadCrumbs(history, [], true);
  return (
    <Screen
      title={intl.formatMessage({ id: 'changePreferencesHeader' })}
      tabTitle={intl.formatMessage({ id: 'changePreferencesHeader' })}
      hidden={hidden}
      breadCrumbs={breadCrumbs}
      loading={!user}
    >
      {user && !user.is_slack_addressable && (
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
      )}
      <Typography>
        {intl.formatMessage({ id: 'changePreferencesHeader' })}
      </Typography>
      {user && (
        <form
          noValidate
          autoComplete="off"
        >
          <ListItem
            key="email"
            button
            onClick={handleToggleEmail}
          >
            <ListItemIcon>
              <Checkbox
                value={emailEnabled}
                checked={emailEnabled}
              />
            </ListItemIcon>
            <ListItemText
              className={classes.name}
            >
              {intl.formatMessage({ id: 'emailEnabledLabel' })}
            </ListItemText>
          </ListItem>
          <ListItem
            key="slack"
            button
            onClick={handleToggleSlack}
          >
            <ListItemIcon>
              <Checkbox
                value={slackEnabled}
                checked={slackEnabled}
                disabled={!user || !user.is_slack_addressable}
              />
            </ListItemIcon>
            <ListItemText
              className={user && user.is_slack_addressable ? classes.name : classes.disabled}
            >
              {intl.formatMessage({ id: 'slackEnabledLabel' })}
            </ListItemText>
          </ListItem>
          <TextField
            id="emailDelay"
            label={intl.formatMessage({ id: 'emailDelayInputLabel' })}
            type="number"
            InputLabelProps={{
              shrink: true,
            }}
            variant="outlined"
            onChange={handleChangeEmailDelay}
            value={emailDelay}
          />
          <TextField
            id="slackDelay"
            label={intl.formatMessage({ id: 'slackDelayInputLabel' })}
            type="number"
            InputLabelProps={{
              shrink: true,
            }}
            variant="outlined"
            onChange={handleChangeSlackDelay}
            value={slackDelay}
          />
        </form>
      )}
      <Button
        onClick={onSetPreferences}
      >
        {intl.formatMessage({ id: 'changePreferencesButton' })}
      </Button>
    </Screen>
  );
}

ChangeNotificationPreferences.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default ChangeNotificationPreferences;
