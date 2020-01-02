import React, { useState, useReducer } from 'react';
import _ from 'lodash';
import { Auth } from 'aws-amplify';
import { Button, TextField, Typography } from '@material-ui/core';
import { useIntl } from 'react-intl';
import { toastError } from '../../utils/userMessage';


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
  };
  const { authState } = props;
  const [userState, dispatch] = useReducer(reducer, empty);
  const [errorMessage, setErrorMessage] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);
  const intl = useIntl();

  const {
    email,
    code,
    password,
  } = userState;

  function handleChange(name) {
    return (event) => {
      const { target: { value } } = event;
      dispatch({ name, value });
    };
  }

  function onSendCode() {
    Auth.forgotPassword(email)
      .then(() => {
        setErrorMessage('');
        setCodeSent(true);
        setPasswordReset(false);
      })
      .catch((error) => {
        const { code } = error;
        if (code === 'UserNotFoundException') {
          const message = intl.formatMessage({ id: 'forgotPasswordEmailNotFound' });
          console.log(message);
          setErrorMessage(message);
        } else {
          toastError('errorForgotPasswordCodeFailed');
        }
      });
  }

  function onSetNewPassword() {
    Auth.forgotPasswordSubmit(email, code, password)
      .then(() => {
        setErrorMessage('');
        setCodeSent(false);
        setPasswordReset(true);
      })
      .catch((error) => {
        const { code } = error;
        if (code === 'CodeMismatchException') {
          const message = intl.formatMessage( { id: 'forgotPasswordInvalidCode' });
          setErrorMessage(message);
        } else {
          toastError('errorForgotPasswordSetFailed');
        }
      });
  }

  if (authState !== 'forgotPassword') {
    return <React.Fragment/>;
  }

  if (!codeSent && !passwordReset) {
    return (
      <div>
        <Typography>
          {intl.formatMessage({ id: 'forgotPasswordHeader' })}
        </Typography>
        {!_.isEmpty(errorMessage) && (
          <Typography
            color="error"
          >
            {errorMessage}
          </Typography>
        )
        }
        <form
          noValidate
          autoComplete="off"
        >
          <TextField
            id="email"
            label={intl.formatMessage({ id: 'forgotPasswordEmailLabel' })}
            onChange={handleChange('email')}
            margin="normal"
          />
        </form>
        <Button
          onClick={onSendCode}
          disabled={_.isEmpty(email)}
        >
          {intl.formatMessage({ id: 'forgotPasswordSendCodeButton' })}
        </Button>
      </div>
    );
  }

  if (codeSent) {
    return (
      <div>
        <Typography>
          {intl.formatMessage({ id: 'forgotPasswordHeader' })}
        </Typography>
        {!_.isEmpty(errorMessage) && (
          <Typography
            color="error"
          >
            {errorMessage}
          </Typography>
        )
        }
        <form
          noValidate
          autoComplete="off"
        >
          <TextField
            id="code"
            label={intl.formatMessage({ id: 'forgotPasswordCodeLabel' })}
            onChange={handleChange('code')}
            margin="normal"
          />
          <TextField
            id="password"
            label={intl.formatMessage({ id: 'forgotPasswordNewPasswordLabel' })}
            onChange={handleChange('password')}
            type="password"
            margin="normal"
          />
        </form>

        <Button
          onClick={onSendCode}
        >
          {intl.formatMessage({ id: 'forgotPasswordResendCode' })}
        </Button>
        <Button
          onClick={onSetNewPassword}
          disabled={_.isEmpty(code) || _.isEmpty(password)}
        >
          {intl.formatMessage({ id: 'forgotPasswordResetPasswordButton' })}
        </Button>
      </div>
    );
  }

  if (passwordReset) {
    return (
      <div>
        Your password is reset. Click <a href="/">here</a> to log in.
      </div>
    );
  }

  return (
    <React.Fragment/>
  );
}

export default ForgotPassword;
