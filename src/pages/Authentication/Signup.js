import React, { useReducer, useState } from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router';
import { useIntl } from 'react-intl';
import { withStyles } from '@material-ui/core/styles';
import { makeStyles } from '@material-ui/core/styles';
import _ from 'lodash';
import { Checkbox, TextField } from '@material-ui/core';
import Container from '@material-ui/core/Container';
import CssBaseline from '@material-ui/core/CssBaseline';
import Avatar from '@material-ui/core/Avatar';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import Link from '@material-ui/core/Link';
import { resendVerification, signUp } from '../../api/sso';
import ApiBlockingButton from '../../components/SpinBlocking/ApiBlockingButton';
import config from '../../config';
import SpinningButton from '../../components/SpinBlocking/SpinningButton';

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

const GreenCheckbox = withStyles({
  root: {
    color: '#ff0000',
    '&$checked': {
      color: '#00cc00',
    },
  },
  checked: {},
})(props => <Checkbox color="default" {...props} />);

function reducer(state, action) {
  const { name, value } = action;
  const newState = {
    ...state,
    [name]: value,
  };
  return newState;
}

function Signup(props) {
  const classes = useStyles();
  const { authState } = props;
  const empty = {
    name: '',
    email: '',
    password: '',
    repeat: '',
    terms: false,
  };

  const [userState, dispatch] = useReducer(reducer, empty);
  const [postSignUp, setPostSignUp] = useState(undefined);
  const [callActive, setCallActive] = useState(false);
  const intl = useIntl();
  const history = useHistory();
  const { location } = history;
  const { pathname, hash } = location;
  const SIGNUP_LOGO = 'Uclusion_Logo_White_Micro.png';

  function handleChange(name) {
    return (event) => {
      const {
        target: { value },
      } = event;
      dispatch({ name, value });
    };
  }

  function handleCheckedChange(name) {
    return (event) => {
      const {
        target: { checked },
      } = event;
      dispatch({ name, value: checked });
    };
  }

  function getRedirect(){
    let redirect;
    if (pathname !== '/') {
      // we came here by some other link and need to log in
      redirect = pathname;
      if (hash) {
        redirect += hash;
      }
    }
    return redirect;
  }

  function onResend() {
    const { email } = userState;
    setCallActive(true);
    const redirect = getRedirect();
    return resendVerification(email, redirect).then((result) => {
      const { response } = result;
      setPostSignUp(response);
      setCallActive(false);
    });
  }

  function onSignUp(form) {
    form.preventDefault();
    setCallActive(true);
    const { name, email, password } = userState;
    const redirect = getRedirect();

    return signUp(name, email, password, redirect).then((result) => {
      const { response } = result;
      setPostSignUp(response);
      setCallActive(false);
    });
  }

  function getResendButton() {
    return (
      <ApiBlockingButton
        fullWidth
        variant="contained"
        className={classes.submit}
        onClick={onResend}
      >
        {intl.formatMessage({ id: 'signupResendCodeButton' })}
      </ApiBlockingButton>
    );
  }

  if (authState !== 'signUp') {
    return <></>;
  }

  if (postSignUp === 'USER_CREATED') {
    return (
      <Container component="main" maxWidth="xs">
        <CssBaseline/>
        <div className={classes.paper}>
          <Avatar className={classes.avatar}>
            <img width="35" height="35" src={`/images/${SIGNUP_LOGO}`} alt="Uclusion"/>
          </Avatar>
          <Typography component="h1" variant="h5" align="center">
            {intl.formatMessage({ id: 'signupCreatedUser' })}
          </Typography>
          {getResendButton()}
        </div>
      </Container>
    );
  }

  if (postSignUp === 'VERIFICATION_RESENT') {
    return (
      <Container component="main" maxWidth="xs">
        <CssBaseline/>
        <div className={classes.paper}>
          <Avatar className={classes.avatar}>
            <img width="35" height="35" src={`/images/${SIGNUP_LOGO}`} alt="Uclusion"/>
          </Avatar>
          <Typography component="h1" variant="h5" align="center">
            {intl.formatMessage({ id: 'signupSentEmail' })}
          </Typography>
          {getResendButton()}
        </div>
      </Container>
    );
  }

  if (postSignUp === 'ACCOUNT_EXISTS') {
    return (
      <Container component="main" maxWidth="xs">
        <CssBaseline/>
        <div className={classes.paper}>
          <Avatar className={classes.avatar}>
            <img width="35" height="35" src={`/images/${SIGNUP_LOGO}`} alt="Uclusion"/>
          </Avatar>
          <Typography component="h1" variant="h5" align="center">
            {intl.formatMessage({ id: 'signupAccountExists' })}
          </Typography>
          <Grid container justify="center">
            <Grid item>
              <Link href="/" variant="body2">
                {intl.formatMessage({ id: 'signupAccountExistsLoginLink' })}
              </Link>
            </Grid>
          </Grid>
        </div>
      </Container>
    );
  }

  const { name, email, password, repeat, terms } = userState;
  const formInvalid = !terms || _.isEmpty(name) || _.isEmpty(email) || _.isEmpty(password) || _.isEmpty(repeat) || password !== repeat || password.length < 6;
  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline/>
      <div className={classes.paper}>
        <Avatar className={classes.avatar}>
          <img width="35" height="35" src={`/images/${SIGNUP_LOGO}`} alt="Uclusion"/>
        </Avatar>
        <Typography component="h1" variant="h5">
          {intl.formatMessage({ id: 'signupTitle' })}
        </Typography>
        <form
          className={classes.form}
          autoComplete="off"
          onSubmit={onSignUp}
        >
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                autoComplete="name"
                name="name"
                variant="outlined"
                required
                fullWidth
                id="name"
                autoFocus
                label={intl.formatMessage({ id: 'signupNameLabel' })}
                onChange={handleChange('name')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                required
                fullWidth
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                label={intl.formatMessage({ id: 'signupEmailLabel' })}
                onChange={handleChange('email')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                required
                fullWidth
                name="password"
                type="password"
                id="password"
                helperText={password.length < 6 ? intl.formatMessage({ id: 'signupPasswordHelper' }) : ''}
                InputProps={{
                  minLength: 6,
                }}
                autoComplete="new-password"
                label={intl.formatMessage({ id: 'signupPasswordLabel' })}
                onChange={handleChange('password')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                id="repeat"
                name="repeat"
                type="password"
                variant="outlined"
                autoComplete="new-password"
                error={repeat && password !== repeat}
                helperText={repeat !== password ? intl.formatMessage({ id: 'signupPasswordRepeatHelper' }) : ''}
                InputProps={{
                  minLength: 6,
                }}
                label={intl.formatMessage({
                  id: 'signupPasswordRepeatLabel',
                })}
                onChange={handleChange('repeat')}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                <GreenCheckbox
                  id="terms"
                  name="terms"
                  required
                  checked={terms}
                  onChange={handleCheckedChange('terms')}
                />
                <Typography>
                  {intl.formatMessage({ id: 'signupAgreeTermsOfUse' })}
                  <Link
                    href={config.termsOfUseLink}
                    target="_blank"
                  >
                    {intl.formatMessage({ id: 'signupTermsOfUse' })}</Link>
                </Typography>
              </div>
            </Grid>
          </Grid>
          <SpinningButton
            spinning={callActive}
            fullWidth
            variant="contained"
            className={classes.submit}
            type="submit"
            disabled={formInvalid}
          >
            {intl.formatMessage({ id: 'signupSignupLabel' })}
          </SpinningButton>
          <Grid container justify="flex-end">
            <Grid item>
              <Link href="/" variant="body2">
                {intl.formatMessage({ id: 'signupHaveAccount' })}
              </Link>
            </Grid>
          </Grid>
        </form>
      </div>
    </Container>
  );
}

Signup.propTypes = {
  authState: PropTypes.string,
};

Signup.defaultProps = {
  authState: '',
};
export default Signup;