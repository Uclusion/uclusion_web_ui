import React, { useContext, useReducer, useState } from 'react';
import _ from 'lodash'
import { Auth } from 'aws-amplify'
import clsx from 'clsx'
import Grid from '@material-ui/core/Grid'
import PropTypes from 'prop-types'
import {
  Button,
  TextField,
  Typography,
  ListItem,
  FormControl,
  Select,
  MenuItem,
  ListItemIcon, Checkbox, ListItemText
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles'
import { useIntl } from 'react-intl'
import { toastError } from '../../utils/userMessage'
import Screen from '../../containers/Screen/Screen'
import InputAdornment from '@material-ui/core/InputAdornment';
import IconButton from '@material-ui/core/IconButton';
import { Visibility, VisibilityOff } from '@material-ui/icons';
import SubSection from '../../containers/SubSection/SubSection';
import InputLabel from '@material-ui/core/InputLabel';
import NotificationDelay from '../About/NotificationDelay';
import SpinBlockingButton from '../../components/SpinBlocking/SpinBlockingButton';
import { getFirstWorkspace } from '../../utils/redirectUtils';
import { updateUser } from '../../api/users';
import { accountUserRefresh } from '../../contexts/AccountContext/accountContextReducer';
import { PLANNING_TYPE, SUPPORT_SUB_TYPE } from '../../constants/markets';
import { getNotHiddenMarketDetailsForUser } from '../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';
import { AccountContext } from '../../contexts/AccountContext/AccountContext';
import { isFederated } from '../../contexts/CognitoUserContext/cognitoUserContextHelper';
import { CognitoUserContext } from '../../contexts/CognitoUserContext/CongitoUserContext';

const useStyles = makeStyles(
  {
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
    }
  }, {name: 'change'}
)
function AccountPreferences(props) {
  const { hidden } = props;
  const [marketsState] = useContext(MarketsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [userState, userDispatch] = useContext(AccountContext);
  const cognitoUser = useContext(CognitoUserContext);
  const [oldPassword, setOldPassword] = useState(undefined);
  const [newPassword, setNewPassword] = useState(undefined);
  const [repeatPassword, setRepeatPassword] = useState(undefined);
  const [oldOpen, setOldOpen] = useState(false)
  const [newOpen, setNewOpen] = useState(false)
  const [repeatOpen, setRepeatOpen] = useState(false)
  const [chosenMarketId, setChosenMarketId] = useState(undefined);
  const intl = useIntl();
  const classes = useStyles();
  const myNotHiddenMarketsState = getNotHiddenMarketDetailsForUser(marketsState, marketPresencesState);
  let markets = [];
  if (myNotHiddenMarketsState.marketDetails) {
    const filtered = myNotHiddenMarketsState.marketDetails.filter((market) =>
      market.market_type === PLANNING_TYPE);
    markets = _.sortBy(filtered, (market) => market.market_sub_type === SUPPORT_SUB_TYPE, 'name');
  }
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
  const { user } = userState || {};
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

  function onSetNewPassword() {
    // See https://aws-amplify.github.io/docs/js/authentication#change-password
    Auth.currentAuthenticatedUser()
      .then((user) => Auth.changePassword(user, oldPassword, newPassword))
      .then(() => {
        setOldPassword(undefined);
        setNewPassword(undefined);
        setRepeatPassword(undefined);
      })
      .catch((error) => {
        console.error(error);
        toastError(error, 'errorChangePasswordFailed');
      });
  }

  function handleChangeNew(password) {
    if(password && password.currentTarget){
      setNewPassword(password.currentTarget.value);
    }
  }

  function handleChangeOld(password) {
    if(password && password.currentTarget){
      setOldPassword(password.currentTarget.value);
    }
  }

  function handleChangeRepeat(password) {
    if(password && password.currentTarget){
      setRepeatPassword(password.currentTarget.value);
    }
  }

  const canChangePassword = !isFederated(cognitoUser);
  return (
    <Screen
      title={intl.formatMessage({ id: 'changePasswordHeader' })}
      tabTitle={intl.formatMessage({ id: 'changePasswordHeader' })}
      hidden={hidden}
    >
      <div style={{height: '100%', overflow: 'hidden'}}>
      {canChangePassword && (
        <Grid container spacing={3} style={{marginTop: '3rem'}}>
          <Grid item md={4} xs={12}/>
          <Grid item md={4} xs={12}>
            <SubSection
              title={intl.formatMessage({ id: 'changePasswordHeader' })}
              padChildren
            >
            <form
              noValidate
              autoComplete="off"
            >
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                name="password"
                label={intl.formatMessage({ id: 'changePasswordOldLabel' })}
                key="passwordold"
                type={oldOpen ? 'text' : 'password'}
                id="old"
                value={oldPassword || ''}
                onChange={handleChangeOld}
                autoComplete="current-password"
                InputProps={{
                  endAdornment:
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setOldOpen(!oldOpen)}
                        onMouseDown={(event) => event.preventDefault()}
                      >
                        {oldOpen ? <Visibility/> : <VisibilityOff/>}
                      </IconButton>
                    </InputAdornment>,
                }}
              />
              {oldOpen}
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                name="password"
                label={intl.formatMessage({ id: 'changePasswordNewLabel' })}
                key="passwordnew"
                type={newOpen ? 'text' : 'password'}
                id="new"
                value={newPassword || ''}
                onChange={handleChangeNew}
                autoComplete="current-password"
                InputProps={{
                  endAdornment:
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setNewOpen(!newOpen)}
                        onMouseDown={(event) => event.preventDefault()}
                      >
                        {newOpen ? <Visibility/> : <VisibilityOff/>}
                      </IconButton>
                    </InputAdornment>,
                }}
              />
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                name="password"
                label={intl.formatMessage({ id: 'changePasswordRepeatLabel' })}
                key="passwordrepeat"
                type={repeatOpen ? 'text' : 'password'}
                error={!!repeatPassword && newPassword !== repeatPassword}
                id="repeat"
                value={repeatPassword || ''}
                onChange={handleChangeRepeat}
                autoComplete="current-password"
                InputProps={{
                  endAdornment:
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setRepeatOpen(!repeatOpen)}
                        onMouseDown={(event) => event.preventDefault()}
                      >
                        {repeatOpen ? <Visibility/> : <VisibilityOff/>}
                      </IconButton>
                    </InputAdornment>,
                }}
              />
            </form>
            <Button
              variant="contained"
              fullWidth={true}
              color="primary"
              className={clsx(
                classes.action,
                classes.actionPrimary
              )}
              onClick={onSetNewPassword}
              disabled={_.isEmpty(oldPassword) || _.isEmpty(newPassword)
                || (newPassword !== repeatPassword)}
            >
              {intl.formatMessage({ id: 'changePasswordButton' })}
            </Button>
          </SubSection>
        </Grid>
      </Grid>
      )}

      <Grid container spacing={3} style={{marginTop: '3rem'}}>
        <Grid item md={4} xs={12} />
        <Grid item md={4} xs={12}>
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
                        style={{ backgroundColor: "#ecf0f1" }}
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
                      onClick={() => marketConfigsDispatch({ type: 'emailEnabled', value: !emailEnabled })}
                    />
                  </ListItemIcon>
                  <ListItemText>
                    {intl.formatMessage({ id: 'emailEnabledLabel' })}
                  </ListItemText>
                </ListItem>
                <ListItem key="emailDelay" style={{ paddingTop: 0, marginTop: 0 }}>
                  <NotificationDelay
                    disabled={!emailEnabledValue}
                    onChange={(event) => marketConfigsDispatch({ type: 'emailDelay', value: event.target.value })}
                    value={emailDelayValue}
                    explanationId="emailDelayExplanation" labelId="emailDelayInputLabel"
                  />
                </ListItem>
                <ListItem key="emailDelayYellow" style={{ marginTop: '1rem' }}>
                  <NotificationDelay
                    disabled={!emailEnabledValue}
                    onChange={(event) =>
                      marketConfigsDispatch({ type: 'emailDelayYellow', value: event.target.value })}
                    value={emailDelayYellowValue}
                    explanationId="emailDelayYellowExplanation" labelId="emailDelayYellowInputLabel"
                  />
                </ListItem>
                <ListItem
                  key="slack"
                >
                  <ListItemIcon>
                    <Checkbox
                      checked={slackEnabledValue}
                      disabled={!slackAddressable}
                      onClick={() => marketConfigsDispatch({ type: 'slackEnabled', value: !slackEnabled })}
                    />
                  </ListItemIcon>
                  <ListItemText className={slackAddressable ? undefined : classes.disabled}>
                    {intl.formatMessage({ id: 'slackEnabledLabel' })}
                  </ListItemText>
                </ListItem>
                <ListItem key="slackDelay" style={{ paddingTop: 0, marginTop: 0 }}>
                  <NotificationDelay
                    disabled={slackDelayDisabled}
                    onChange={(event) => marketConfigsDispatch({ type: 'slackDelay', value: event.target.value })}
                    value={slackDelayValue}
                    explanationId="slackDelayExplanation" labelId="slackDelayInputLabel"/>
                </ListItem>
                <ListItem key="changePreferences" style={{ marginTop: '1rem' }}>
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
        </Grid>
        <Grid item md={4} xs={12} />
      </Grid>
      </div>
    </Screen>
  );
}

AccountPreferences.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default AccountPreferences;
