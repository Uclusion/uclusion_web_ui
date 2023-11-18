import React, { useState, useEffect, useReducer } from "react";
import _ from 'lodash';
import { Auth } from 'aws-amplify';
import { Button, TextField, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useIntl } from 'react-intl';
import Container from '@material-ui/core/Container';
import CssBaseline from '@material-ui/core/CssBaseline';
import Avatar from '@material-ui/core/Avatar';
import Grid from '@material-ui/core/Grid';
import Link from '@material-ui/core/Link';
import { toastError } from '../../utils/userMessage';

const useStyles = makeStyles(theme => ({
  paper: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: '#3f6b72',
  },
  form: {
    width: '100%',
    marginTop: theme.spacing(3),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
    backgroundColor: '#3f6b72',
    color: '#fff',
  },
}));

function reducer(state, action) {
  const { name, value } = action;
  const newState = {
    ...state,
    [name]: value,
  };
  return newState;
}

function ForgotPassword(props) {
  const empty = {
    email: '',
    code: '',
    password: '',
    repeat: '',
  };

  const { authState, authData } = props;
  const [userState, dispatch] = useReducer(reducer, empty);
  const [errorMessage, setErrorMessage] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);
  const intl = useIntl();
  const classes = useStyles();

  useEffect(() => {
    if (authData && authData.email) {
      dispatch({ name: 'email', value: authData.email });
    }
  }, [authData]);

  const ALTERNATE_SIDEBAR_LOGO = 'Uclusion_Logo_White_Micro.png';
  const { email, code, password, repeat } = userState;

  function handleChange(name) {
    return (event) => {
      const {
        target: { value },
      } = event;
      dispatch({ name, value });
    };
  }

  function onSendCode(form) {
    if (form) {
      form.preventDefault();
    }
    Auth.forgotPassword(email)
      .then(() => {
        setErrorMessage('');
        setCodeSent(true);
        setPasswordReset(false);
      })
      .catch(error => {
        const { code } = error;
        if (code === 'UserNotFoundException') {
          const message = intl.formatMessage({
            id: 'forgotPasswordEmailNotFound',
          });
          setErrorMessage(message);
        } else {
          toastError(error, 'errorForgotPasswordCodeFailed');
        }
      });
  }

  function onSetNewPassword(form) {
    form.preventDefault();
    return Auth.forgotPasswordSubmit(email, code, password)
      .then(() => {
        setErrorMessage('');
        setCodeSent(false);
        setPasswordReset(true);
      })
      .catch(error => {
        const { code } = error;
        if (code === 'CodeMismatchException') {
          const message = intl.formatMessage({
            id: 'forgotPasswordInvalidCode',
          });
          setErrorMessage(message);
        } else {
          toastError(error, 'errorForgotPasswordSetFailed');
        }
      });
  }

  if (authState !== 'forgotPassword') {
    return <React.Fragment/>;
  }

  if (!codeSent && !passwordReset) {
    return (
      <Container component="main" maxWidth="xs">
        <CssBaseline/>
        <div className={classes.paper}>
          <Avatar className={classes.avatar}>
            <img
              width="35"
              height="35"
              src={`/images/${ALTERNATE_SIDEBAR_LOGO}`}
              alt="Uclusion"
            />
          </Avatar>
          <Typography component="h1" variant="h5">
            {intl.formatMessage({ id: 'forgotPasswordHeader' })}
          </Typography>
          {!_.isEmpty(errorMessage) && (
            <Typography color="error">{errorMessage}</Typography>
          )}
          <form
            onSubmit={onSendCode}
            className={classes.form}
            autoComplete="off"
          >
            <TextField
              id="email"
              fullWidth
              autoComplete="email"
              required
              value={email}
              label={intl.formatMessage({ id: 'forgotPasswordEmailLabel' })}
              onChange={handleChange("email")}
              margin="normal"
            />
            <Button
              fullWidth
              variant="contained"
              className={classes.submit}
              type="submit"
              disabled={_.isEmpty(email)}
            >
              {intl.formatMessage({ id: 'forgotPasswordSendCodeButton' })}
            </Button>
          </form>

          <Grid container>
            <Grid item xs></Grid>
            <Grid item>
              <Link href="/" variant="body2">
                Back to Sign In
              </Link>
            </Grid>
          </Grid>
        </div>
      </Container>
    );
  }

  if (codeSent) {
    const formInvalid = _.isEmpty(code) ||
      _.isEmpty(password) ||
      _.isEmpty(repeat) ||
      password !== repeat ||
      password.length < 6;

    return (
      <Container component="main" maxWidth="xs">
        <CssBaseline/>
        <div className={classes.paper}>
          <Avatar className={classes.avatar}>
            <img
              width="35"
              height="35"
              src={`/images/${ALTERNATE_SIDEBAR_LOGO}`}
              alt="Uclusion"
            />
          </Avatar>
          <Typography component="h1" variant="h5">
            {intl.formatMessage({ id: 'forgotPasswordHeader' })}
          </Typography>
          {!_.isEmpty(errorMessage) && (
            <Typography color="error">{errorMessage}</Typography>
          )}
          <form
            onSubmit={onSetNewPassword}
            className={classes.form}
            autoComplete="off"
          >
            <TextField
              id="code"
              autoComplete="code"
              key="code"
              type="number"
              required
              fullWidth
              label={intl.formatMessage({ id: 'forgotPasswordCodeLabel' })}
              onChange={handleChange('code')}
              margin="normal"
            />

            <TextField
              id="password"
              required
              fullWidth
              label={intl.formatMessage({
                id: 'forgotPasswordNewPasswordLabel',
              })}
              InputProps={{
                minLength: 6,
              }}
              onChange={handleChange('password')}
              type="password"
              autoComplete="new-password"
              helperText={password.length < 6 ? intl.formatMessage({ id: 'forgotPasswordHelper' }) : ''}
              margin="normal"
            />

            <TextField
              id="repeat"
              required
              fullWidth
              autoComplete="new_password"
              label={intl.formatMessage({
                id: 'forgotPasswordRepeatLabel',
              })}
              helperText={password !== repeat ? intl.formatMessage({ id: 'forgotPasswordRepeatHelper' }) : ''}
              onChange={handleChange('repeat')}
              error={repeat && password !== repeat}
              type="password"
              margin="normal"
            />

            <Button
              fullWidth
              variant="contained"
              className={classes.submit}
              type="submit"
              disabled={formInvalid}
            >
              {intl.formatMessage({ id: 'forgotPasswordResetPasswordButton' })}
            </Button>
          </form>

          <Button fullWidth variant="contained" onClick={onSendCode}>
            {intl.formatMessage({ id: 'forgotPasswordResendCode' })}
          </Button>
        </div>
      </Container>
    );
  }

  if (passwordReset) {
    return (
      <Container component="main" maxWidth="xs">
        <CssBaseline/>
        <div className={classes.paper}>
          <Avatar className={classes.avatar}>
            <img
              width="35"
              height="35"
              src={`/images/${ALTERNATE_SIDEBAR_LOGO}`}
              alt="Uclusion"
            />
          </Avatar>
          <Typography component="h1" variant="h5">
            Your password is reset!
          </Typography>
          <Typography component="h1" variant="h5">
            Click <a href="/">here</a> to Sign In.
          </Typography>
        </div>
      </Container>
    );
  }

  return <React.Fragment/>;
}

export default ForgotPassword;
