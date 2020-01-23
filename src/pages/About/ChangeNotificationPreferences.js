import React, { useEffect, useState } from 'react';
import {
  Button,
  Checkbox, ListItem,
  ListItemIcon,
  ListItemText, makeStyles,
  Typography,
} from '@material-ui/core';
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
  const intl = useIntl();
  const classes = useStyles();

  useEffect(() => {
    if (!hidden && user === undefined) {
      getSSOInfo().then((ssoInfo) => {
        const { idToken, ssoClient } = ssoInfo;
        return ssoClient.accountCognitoLogin(idToken).then((loginInfo) => {
          const { user: myUser } = loginInfo;
          setUser(myUser);
          setEmailEnabled(myUser.email_enabled);
          setSlackEnabled(myUser.slack_enabled);
        });
      }).catch((error) => toastErrorAndThrow(error, 'errorGetIdFailed'));
    }
  }, [user, hidden]);

  function onSetPreferences() {
    updateUser({ emailEnabled, slackEnabled });
  }

  function handleToggleEmail() {
    setEmailEnabled(!emailEnabled);
  }

  function handleToggleSlack() {
    setSlackEnabled(!slackEnabled);
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
      <Typography>
        {intl.formatMessage({ id: 'changePreferencesHeader' })}
      </Typography>
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
      </form>
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
