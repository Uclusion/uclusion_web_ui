import React, { useEffect, useState } from 'react';
import {
  Button,
  Checkbox, ListItem,
  ListItemIcon,
  ListItemText, makeStyles, TextField,
  Typography, Grid, InputLabel, FormControl, Card
} from '@material-ui/core'
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { updateUser } from '../../api/users';
import clsx from 'clsx'
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
  action: {
    boxShadow: "none",
    padding: "4px 16px",
    textTransform: "none",
    "&:hover": {
      boxShadow: "none"
    }
  },
  actionPrimary: {
    backgroundColor: "#2D9CDB",
    color: "white",
    "&:hover": {
      backgroundColor: "#2D9CDB"
    }
  },
  label: {
    top: 2,
    left: 5,
    [theme.breakpoints.down('sm')]: {
      top: -50
    },
  },
  formControl: {
    '&:first-child': {
      marginBottom: '50px',
      marginTop: '50px'
    }
  }
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
      <Grid container spacing={3} >
        <Grid item md={6} xs={12}>
          <Card style={{padding: '2rem'}}>
          <Typography style={{paddingBottom: '1rem'}}>
            {intl.formatMessage({ id: 'changePreferencesHeader' })}
          </Typography>
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
        
      {user && (
        <form
          noValidate
          autoComplete="off"
            >
            <Grid
              container
              direction="row"
              justify="center"
              alignItems="baseline"
              style={{padding: '1rem', paddingBottom: '0'} }
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
            </Grid>
            <Grid
              container
              direction="row"
              justify="space-evenly"
              alignItems="stretch"
              style={{padding: '1rem', paddingTop: '0'} }
            >
              <FormControl fullWidth={true} margin="normal" className={classes.formControl}>
                <InputLabel htmlFor="emailDelay" shrink={true} className={classes.label}>
                  {intl.formatMessage({ id: 'emailDelayInputLabel' })}
                </InputLabel>
                <TextField
                  id="emailDelay"
                  type="number"
                  variant="outlined"
                  onChange={handleChangeEmailDelay}
                  value={emailDelay}
                />
              </FormControl>
              <FormControl fullWidth={true} margin="normal" className={classes.formControl}>
                <InputLabel htmlFor="slackDelay" shrink={true} className={classes.label}>
                  {intl.formatMessage({ id: 'slackDelayInputLabel' })}
                </InputLabel>
                <TextField
                  id="slackDelay"
                  type="number"
                  variant="outlined"
                  onChange={handleChangeSlackDelay}
                  value={slackDelay}
                />
              </FormControl>
            <Button
              variant="outlined"
              fullWidth={true}
              color="primary"
              className={ clsx(
                classes.action,
                classes.actionPrimary
              )}
              onClick={onSetPreferences}
            >
              {intl.formatMessage({ id: 'changePreferencesButton' })}
            </Button>
            </Grid>
          </form>
        )}
      </Card>
        </Grid>
      </Grid>
    </Screen>
  );
}

ChangeNotificationPreferences.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default ChangeNotificationPreferences;
