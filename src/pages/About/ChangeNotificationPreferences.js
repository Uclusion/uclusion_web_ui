import React, { useContext, useEffect, useState } from 'react'
import {
  Card,
  Checkbox,
  ExpansionPanel,
  ExpansionPanelDetails,
  ExpansionPanelSummary,
  FormControl,
  Grid,
  InputLabel,
  ListItem,
  ListItemIcon,
  ListItemText,
  makeStyles,
  TextField,
  Typography,
} from '@material-ui/core'
import _ from 'lodash'
import { useIntl } from 'react-intl'
import PropTypes from 'prop-types'
import { updateUser } from '../../api/users'
import clsx from 'clsx'
import config from '../../config'
import Screen from '../../containers/Screen/Screen'
import { makeBreadCrumbs } from '../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import { AccountUserContext } from '../../contexts/AccountUserContext/AccountUserContext'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import SpinBlockingButton from '../../components/SpinBlocking/SpinBlockingButton'

const useStyles = makeStyles((theme) => ({
  name: {},
  disabled: {
    color: theme.palette.text.disabled,
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
    '&:hover': {
      backgroundColor: '#2D9CDB'
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

function ChangeNotificationPreferences (props) {
  const { hidden } = props;
  const [userState] = useContext(AccountUserContext) || {};
  const { user } = userState;

  const [emailEnabled, setEmailEnabled] = useState(undefined);
  const [slackEnabled, setSlackEnabled] = useState(undefined);
  const [slackDelay, setSlackDelay] = useState(undefined);
  const [emailDelay, setEmailDelay] = useState(undefined);
  const slackNotAvailable = _.isEmpty(user) || !user.is_slack_addressable;
  const intl = useIntl();
  const classes = useStyles();

  useEffect(() => {
    if (!_.isEmpty(user)) {
      setEmailEnabled(user.email_enabled)
      setSlackDelay(user.slack_delay);
      setSlackEnabled(!slackNotAvailable && user.slack_enabled)
      setEmailDelay(user.email_delay);
    }
  }, [user, setEmailEnabled, setEmailDelay, setSlackEnabled, setSlackDelay, slackNotAvailable]);

  function onSetPreferences () {
    return updateUser({ emailEnabled, slackEnabled, slackDelay, emailDelay });
  }

  function handleToggleEmail () {
    setEmailEnabled(!emailEnabled);
  }

  function handleToggleSlack () {

    if (!slackNotAvailable) {
      setSlackEnabled(!slackEnabled);
    }
  }

  function handleChangeSlackDelay (event) {
    const { value } = event.target;
    const parsed = parseInt(value, 10);
    if (parsed && parsed > 0) {
      setSlackDelay(parsed);
    }
  }

  function handleChangeEmailDelay (event) {
    const { value } = event.target;
    const parsed = parseInt(value, 10);
    if (parsed && parsed > 0) {
      setEmailDelay(parsed * 60);
    }
  }

  const emailDelayInHours = Math.round(emailDelay / 60);
  const advancedEnabled = slackEnabled || emailEnabled;
  const history = useHistory();
  const breadCrumbs = makeBreadCrumbs(history, [], true);
  return (
    <Screen
      title={intl.formatMessage({ id: 'changePreferencesHeader' })}
      tabTitle={intl.formatMessage({ id: 'changePreferencesHeader' })}
      hidden={hidden}
      breadCrumbs={breadCrumbs}
      loading={_.isEmpty(user)}
    >
      <Grid container spacing={3}>
        <Grid item md={6} xs={12}>
          <Card elevation={0} style={{ padding: '2rem' }}>
            <Typography style={{ paddingBottom: '1rem' }}>
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
                  style={{ padding: '1rem', paddingBottom: '0' }}
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
                {advancedEnabled &&
                (<ExpansionPanel>
                    <ExpansionPanelSummary
                      expandIcon={<ExpandMoreIcon/>}
                    >
                      {intl.formatMessage({ id: 'advanced' })}
                    </ExpansionPanelSummary>
                    <ExpansionPanelDetails>
                      <Grid
                        container
                        direction="row"
                        justify="space-evenly"
                        alignItems="stretch"
                        style={{ padding: '1rem', paddingTop: '0' }}
                      >
                        {emailEnabled && (<FormControl fullWidth={true} margin="normal" className={classes.formControl}>
                          <InputLabel htmlFor="emailDelay" shrink={true} className={classes.label}>
                            {intl.formatMessage({ id: 'emailDelayInputLabel' })}
                          </InputLabel>
                          <TextField
                            id="emailDelay"
                            type="number"
                            variant="outlined"
                            disabled={!emailEnabled}
                            onChange={handleChangeEmailDelay}
                            value={emailDelayInHours}
                          />
                        </FormControl>)}
                        {slackEnabled && (
                          <FormControl fullWidth={true} margin="normal" className={classes.formControl}>
                            <InputLabel htmlFor="slackDelay" shrink={true} className={classes.label}>
                              {intl.formatMessage({ id: 'slackDelayInputLabel' })}
                            </InputLabel>
                            <TextField
                              id="slackDelay"
                              type="number"
                              disabled={!slackEnabled}
                              variant="outlined"
                              onChange={handleChangeSlackDelay}
                              value={slackDelay}
                            />
                          </FormControl>
                        )}

                      </Grid>
                    </ExpansionPanelDetails>
                  </ExpansionPanel>
                )}
              </form>
            )}
            <Grid
              container
              direction="row"
              justify="space-evenly"
              alignItems="stretch"
              style={{ padding: '1rem', paddingTop: '3rem' }}
            >
              <SpinBlockingButton
                variant="outlined"
                fullWidth={true}
                color="primary"
                className={clsx(
                  classes.action,
                  classes.actionPrimary
                )}
                onClick={onSetPreferences}
              >
                {intl.formatMessage({ id: 'changePreferencesButton' })}
              </SpinBlockingButton>
            </Grid>
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
