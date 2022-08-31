import React, { useState } from 'react'
import _ from 'lodash'
import { Auth } from 'aws-amplify'
import clsx from 'clsx'
import Grid from '@material-ui/core/Grid'
import PropTypes from 'prop-types'
import { useHistory } from 'react-router'
import { Button, TextField, Typography, Card } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { useIntl } from 'react-intl'
import { toastError } from '../../utils/userMessage'
import Screen from '../../containers/Screen/Screen'
import { makeBreadCrumbs } from '../../utils/marketIdPathFunctions'
import InputAdornment from '@material-ui/core/InputAdornment';
import IconButton from '@material-ui/core/IconButton';
import { Visibility, VisibilityOff } from '@material-ui/icons';

const styleClasses = makeStyles(
  {
    action: {
      boxShadow: "none",
      padding: "4px 16px",
      textTransform: "none",
      "&:hover": {
        boxShadow: "none"
      }
    },
    container: {
      padding: '2rem',
      maxWidth: '30rem',
      display: 'inline-block',
      marginLeft: 'auto',
      marginRight: 'auto',
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
function ChangePassword(props) {
  const { hidden } = props;
  const [oldPassword, setOldPassword] = useState(undefined);
  const [newPassword, setNewPassword] = useState(undefined);
  const [repeatPassword, setRepeatPassword] = useState(undefined);
  const [oldOpen, setOldOpen] = useState(false)
  const [newOpen, setNewOpen] = useState(false)
  const [repeatOpen, setRepeatOpen] = useState(false)
  const intl = useIntl();
  const classes = styleClasses();

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
        toastError('errorChangePasswordFailed');
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
  const history = useHistory();
  const breadCrumbs = makeBreadCrumbs(history, [], true);

  return (
    <Screen
      title={intl.formatMessage({ id: 'changePasswordHeader' })}
      tabTitle={intl.formatMessage({ id: 'changePasswordHeader' })}
      hidden={hidden}
      breadCrumbs={breadCrumbs}
      loading={!breadCrumbs}
      hideMenu
    >
      <Grid container spacing={3}>
        <Grid item md={4} xs={12}/>
        <Grid item md={4} xs={12}>
          <Card className={classes.container}>
            <Typography>
              {intl.formatMessage({ id: 'changePasswordHeader' })}
            </Typography>
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
              type={oldOpen? 'text': 'password'}
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
                    {oldOpen ? <Visibility /> : <VisibilityOff />}
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
              type={newOpen? 'text': 'password'}
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
                    {newOpen ? <Visibility /> : <VisibilityOff />}
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
              type={repeatOpen? 'text': 'password'}
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
                    {repeatOpen ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </InputAdornment>,
              }}
                />
            </form>
            <Button
              variant="contained"
              fullWidth={true}
              color="primary"
              className={ clsx(
                classes.action,
                classes.actionPrimary
              )}
              onClick={onSetNewPassword}
              disabled={_.isEmpty(oldPassword) || _.isEmpty(newPassword)
              || (newPassword !== repeatPassword)}
            >
              {intl.formatMessage({ id: 'changePasswordButton' })}
            </Button>
          </Card>
        </Grid>
      </Grid>
    </Screen>
  );
}

ChangePassword.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default ChangePassword;
