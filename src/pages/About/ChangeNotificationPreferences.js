import React, { useState } from 'react';
import {
  Button,
  Checkbox, ListItem,
  ListItemIcon,
  ListItemText, makeStyles,
  Typography
} from '@material-ui/core';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { updateUser } from '../../api/users';

const useStyles = makeStyles((theme) => ({
  name: {},
  disabled: {
    color: theme.palette.text.disabled,
  },
}));

function ChangeNotificationPreferences(props) {
  const { user } = props;
  const [emailEnabled, setEmailEnabled] = useState(user.email_enabled);
  const [slackEnabled, setSlackEnabled] = useState(user.slack_enabled);
  const intl = useIntl();
  const classes = useStyles();

  function onSetPreferences() {
    updateUser({ emailEnabled, slackEnabled });
  }

  function handleToggleEmail() {
    setEmailEnabled(!emailEnabled);
  }

  function handleToggleSlack() {
    setSlackEnabled(!slackEnabled);
  }

  return (
    <div>
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
              disabled={!user.is_slack_addressable}
            />
          </ListItemIcon>
          <ListItemText
            className={user.is_slack_addressable ? classes.name : classes.disabled}
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
    </div>
  );
}

ChangeNotificationPreferences.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  user: PropTypes.object.isRequired,
};

export default ChangeNotificationPreferences;
