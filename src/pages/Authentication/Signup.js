import React, { useReducer, useState } from 'react'
import PropTypes from 'prop-types'
import { useHistory } from 'react-router'
import { useIntl } from 'react-intl'
import { makeStyles, withStyles } from '@material-ui/core/styles'
import _ from 'lodash'
import { Checkbox, TextField } from '@material-ui/core'
import Container from '@material-ui/core/Container'
import CssBaseline from '@material-ui/core/CssBaseline'
import Avatar from '@material-ui/core/Avatar'
import Typography from '@material-ui/core/Typography'
import Grid from '@material-ui/core/Grid'
import Link from '@material-ui/core/Link'
import { resendVerification, signUp } from '../../api/sso'
import ApiBlockingButton from '../../components/SpinBlocking/ApiBlockingButton'
import config from '../../config'
import SpinningButton from '../../components/SpinBlocking/SpinningButton'
import PhoneField, { phoneChecker } from '../../components/TextFields/PhoneField'
import { Helmet } from 'react-helmet'
import { Auth } from 'aws-amplify'
import { setRedirect } from '../../utils/redirectUtils'
import Iframe from 'react-iframe'

const useStyles = makeStyles(theme => ({
  outer: {
    marginLeft: "10%",
    width: "80%"
  },
  root: {
    alignItems: "flex-start",
    display: "flex",
    width: "100%"
  },
  formRoot: {
    width: "1500px"
  },
  paper: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  paperNoTop: {
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
  googleButton: {
    marginTop: '2rem',
    width: '100%',
    height: '46px',
    backgroundColor: '#4285f4',
    border: 'none',
    color: '#fff',
    lineHeight: '46px',
    display: 'flex',
    alignItems: 'end',
    cursor: 'pointer'
  },
  googleText: {
    lineHeight: '46px',
    display: 'inline-block',
    width: 'auto',
    marginLeft: 'auto',
    marginRight: 'auto',
    fontSize: '1rem'
  },
  googleImg: {
    transform: 'scale(1.15)'
  },
  spacerText: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '26px'
  },
  inlineHr: {
    width: '100%',
    marginTop: '.6rem',
    border: 'none',
    height: '1px',
    color: '#aaa',
    backgroundColor: '#aaa'
  },
  hr: {
    flex: 5
  },
  orText: {
    color: '#aaa',
    marginRight: '5px',
    marginLeft: '5px'
  }
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
  return {
    ...state,
    [name]: value,
  };
}

function Signup(props) {
  const classes = useStyles();
  const { authState } = props;
  const empty = {
    name: '',
    email: '',
    password: '',
    phone: '',
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
    if (!redirect) {
      // If they did not come from a market link then we want them to create a workspace
      redirect = '/dialogAdd#type=PLANNING';
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
    // the backend will fail unless only the keys it's need are passed, so extract them
    const { name, email, password, phone: rawPhoneNumber } = userState;
    let phone = rawPhoneNumber && !rawPhoneNumber.startsWith('+') && rawPhoneNumber.toString().length === 10 ?
      '+01' + rawPhoneNumber : rawPhoneNumber;
    if (phone && !phone.startsWith('+')) {
      phone = '+' + phone;
    }
    const signupData = { name, email, password, phone };
    let redirect = getRedirect();
    return signUp(signupData, redirect).then((result) => {
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

  const { name, email, password, repeat, terms, phone } = userState;
  const phoneValid = _.isEmpty(phone) || phoneChecker.test(phone);
  const formInvalid = !phoneValid || !terms || _.isEmpty(name) || _.isEmpty(email) || _.isEmpty(password) || _.isEmpty(repeat) || password !== repeat || password.length < 6;
  return (
    <div className={classes.outer}>
      <Helmet>
        <meta name="google-signin-client_id" content="YOUR_CLIENT_ID.apps.googleusercontent.com"></meta>
        <script src="https://apis.google.com/js/platform.js"></script>
      </Helmet>
      <CssBaseline/>
      <dl className={classes.root}>
        <Iframe url="https://www.uclusion.com"
                id="myId"
                width="2700px"
                height="1000px"
                scrolling="no"
                display="initial"
                frameBorder="0"
                position="relative"/>
        <div className={classes.formRoot}>
          <div className={classes.paper}>
            <Avatar className={classes.avatar}>
              <img width="35" height="35" src={`/images/${SIGNUP_LOGO}`} alt="Uclusion"/>
            </Avatar>
            <Typography component="h1" variant="h5">
              {intl.formatMessage({ id: 'signupTitle' })}
            </Typography>
          </div>
          <div className={classes.googleButton} onClick={() => {
            // Must come back to this device so go ahead and set in local storage
            setRedirect(getRedirect());
            Auth.federatedSignIn({provider: 'Google'})
          }}>
            <img className={classes.googleImg} alt="Sign in with Google" src={`/images/btn_google_dark_normal_ios.svg`} />
            <div className={classes.googleText}>Sign in with Google</div>
          </div>
          <div className={classes.spacerText}>
            <span className={classes.hr}>
              <hr className={classes.inlineHr} />
            </span>
            <span className={classes.orText}>or</span>
            <span className={classes.hr}>
              <hr className={classes.inlineHr}/>
            </span>
          </div>
          <div className={classes.paperNoTop}>
            <form
              className={classes.form}
              autoComplete="off"
              onSubmit={onSignUp}
            >
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    value={userState.name}
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
                    value={userState.email}
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
                  <PhoneField
                    variant="outlined"
                    value={userState.phone}
                    label={intl.formatMessage({ id: 'signupPhoneLabel' })}
                    onChange={handleChange('phone')}
                    name="phone"
                    type="tel"
                    id="phone"
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    value={userState.password}
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
                    value={userState.repeat}
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
        </div>
      </dl>
    </div>
  );
}

Signup.propTypes = {
  authState: PropTypes.string,
};

Signup.defaultProps = {
  authState: '',
};
export default Signup;