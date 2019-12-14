import React, { useReducer } from 'react';
import { TextField, Button } from '@material-ui/core';
import { useIntl } from 'react-intl';
import { Auth } from 'aws-amplify';


function reducer(state, action) {
  const { name, value } = action;
  switch (name) {
    case 'name':
      return {
        ...state,
        attributes: {
          name: value,
        },
      };
    case 'username':
      return {
        ...state,
        username: value,
      };
    case 'password':
      return {
        ...state,
        password: value,
      };
    default:
      //do nothing
      break;
  }
}

function Signup(props) {

  const { authState } = props;
  const empty = {
    attributes: {
      name: '',
    },
    username: '',
    password: '',
  };

  const [userState, dispatch] = useReducer(reducer, empty);
  const intl = useIntl();


  function handleChange(name) {
    return (event) => {
      const { target: { value } } = event;
      dispatch({ name, value });
    };
  }

  function onSignup() {
    console.log(userState);
    return Auth.signUp(userState)
      .then((result) => {
        console.log(result);
        alert("Signup sent");
      });
  }


  if (authState !== 'signUp') {
    return <React.Fragment/>;
  }


  return (
    <form
      noValidate
      autoComplete="off">
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
        onChange={handleChange('username')}
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
        onClick={onSignup}
      >
        {intl.formatMessage({ id: 'signupSignupLabel' })}
      </Button>
    </form>
  );
}

export default Signup;