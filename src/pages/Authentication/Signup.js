import React, { useReducer, useState } from 'react';
import { TextField, Button } from '@material-ui/core';
import { useIntl } from 'react-intl';
import { signUp } from '../../api/sso';
import { sendIntlMessage, ERROR } from '../../utils/userMessage';
import { extractErrorJSON } from '../../api/errorUtils';


function reducer(state, action) {
  const { name, value } = action;
  const newState = {
    ...state,
    [name]: value,
  };
  return newState;
}

function Signup(props) {
  const { authState } = props;
  const empty = {
    name: '',
    email: '',
    password: '',
  };

  const [userState, dispatch] = useReducer(reducer, empty);
  const [postSignUp, setPostSignUp] = useState(undefined);
  const intl = useIntl();


  function handleChange(name) {
    return (event) => {
      const { target: { value } } = event;
      dispatch({ name, value });
    };
  }

  function onSignUp() {
    const {
      name,
      email,
      password,
    } = userState;
    return signUp(name, email, password)
      .then((result) => {
        const { response } = result;
        setPostSignUp(response);
      }).catch((error) => {
        return extractErrorJSON(error)
          .then((errorData) => {
            const { error_message } = errorData;
            if (error_message === 'Account exists') {
              setPostSignUp('ALREADY_EXISTS');
            } else {
              sendIntlMessage(ERROR, 'errorSignupFailed');
            }
          })
          .catch(() => {
            sendIntlMessage(ERROR, 'errorSignupFailed');
          });
      });
  }

  function getResendButton() {
    return (
      <Button
        onClick={onSignUp}
      >
        Resend Code
      </Button>
    );
  }

  if (authState !== 'signUp') {
    return <></>;
  }

  if (postSignUp === 'USER_CREATED') {
    return (
      <div>
        Your user is created, and a verification link has been sent to your email.
        Please click the link inside to continue.
        { getResendButton() }
      </div>
    );
  }

  if (postSignUp === 'VERIFICATION_RESENT') {
    return (
      <div>
        We have resent a verification email to you. Please click the link inside to continue.
        { getResendButton() }
      </div>
    );
  }

  if (postSignUp === 'ALREADY_EXISTS') {
    return (
      <div>
        An account with that email already exists, please log in.
      </div>
    );
  }


  return (
    <form
      noValidate
      autoComplete="off"
    >
      <TextField
        id="name"
        label={intl.formatMessage({ id: 'signupNameLabel' })}
        onChange={handleChange('name')}
        margin="normal"
      />
      <br/>
      <TextField
        id="email"
        label={intl.formatMessage({ id: 'signupEmailLabel' })}
        onChange={handleChange('email')}
        margin="normal"
      />
      <br/>
      <TextField
        id="password"
        type="password"
        label={intl.formatMessage({ id: 'signupPasswordLabel' })}
        onChange={handleChange('password')}
        margn="normal"
      />
      <Button
        onClick={onSignUp}
      >
        {intl.formatMessage({ id: 'signupSignupLabel' })}
      </Button>
    </form>
  );
}

export default Signup;
