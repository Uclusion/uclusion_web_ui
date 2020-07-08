import React, { useEffect, useReducer, useState } from 'react'
import PropTypes from 'prop-types'
import { useHistory } from 'react-router'
import { useIntl } from 'react-intl'
import { makeStyles, withStyles } from '@material-ui/core/styles'
import _ from 'lodash'
import clsx from 'clsx'
import { Checkbox, TextField } from '@material-ui/core'
import Container from '@material-ui/core/Container'
import CssBaseline from '@material-ui/core/CssBaseline'
import Avatar from '@material-ui/core/Avatar'
import Typography from '@material-ui/core/Typography'
import Grid from '@material-ui/core/Grid'
import Link from '@material-ui/core/Link'
import { getMarketInfoForToken, resendVerification, signUp } from '../../api/sso'
import ApiBlockingButton from '../../components/SpinBlocking/ApiBlockingButton'
import config from '../../config'
import SpinningButton from '../../components/SpinBlocking/SpinningButton'
import PhoneField, { phoneChecker } from '../../components/TextFields/PhoneField'
import { Helmet } from 'react-helmet'
import { Auth } from 'aws-amplify'
import { setRedirect } from '../../utils/redirectUtils'
import Iframe from 'react-iframe'
import { GithubLoginButton } from 'react-social-login-buttons'
import { toastError } from '../../utils/userMessage'

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
    maxWidth: "600px",
    marginLeft: 'auto',
    marginRight: 'auto',
    minWidth: '450px'
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
    marginLeft: '-40px',
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
  },
  textWrapper: {
    marginLeft: '-40px'
  },
  googleTextWrapper: {
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  centerText: {
    textAlign: 'center',
    marginBottom: '20px'
  },
  aboutText: {
    padding: '0 5rem',
    '& p': {
      margin: '10px'
    }
  },
  stack: {
    flexDirection: 'column',
    display: 'flex'
  },
  centerColumn: {
    maxWidth: "600px",
    marginLeft: 'auto',
    marginRight: 'auto',
    minWidth: '450px'
  },
  marginTop: {
    marginTop: '20px',
  },
  inviteText: {
    fontSize: '3rem'
  },
  marginLeft: {
    marginLeft: '20px'
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
  const { authState, action, marketToken, onStateChange } = props;
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
  const [wasBlurred, setWasBlurred] = useState(false);
  const intl = useIntl();
  const history = useHistory();

  const [myLoading, setMyLoading] = useState(undefined);
  const [myMarket, setMyMarket] = useState(undefined);
  const SIGNUP_LOGO = 'Uclusion_Logo_White_Micro.png';
  const LOGO_COLOR = '#3F6B72'
  useEffect(() => {
    if (action === 'invite' && marketToken && myLoading !== marketToken) {
      setMyLoading(marketToken);
      console.info('Loading info');
      getMarketInfoForToken(marketToken)
        .then((market) => {
          setMyMarket(market);
        }).catch((error) => {
          console.error(error);
          toastError('errorMarketFetchFailed');
        });
    }
  }, [marketToken, action, myLoading]);

  function onPasswordBlurred() {
    setWasBlurred(true);
  }
  
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
    const { location } = history;
    const { pathname, hash } = location;
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
      redirect = '/onboarding';
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

  const { name, email, password, repeat, terms, phone } = userState;

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
            {intl.formatMessage({ id: 'signupCreatedUser' }, { email })}
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


  const phoneValid = _.isEmpty(phone) || phoneChecker.test(phone);
  const formInvalid = !phoneValid || !terms || _.isEmpty(name) || _.isEmpty(email) || _.isEmpty(password) || _.isEmpty(repeat) || password !== repeat || password.length < 6;
  return (
    <div className={classes.outer}>
      <Helmet>
        <meta name="google-signin-client_id" content="YOUR_CLIENT_ID.apps.googleusercontent.com"></meta>
        <script src="https://apis.google.com/js/platform.js"></script>
      </Helmet>
      <CssBaseline/>
      <dl className={clsx(myMarket ? classes.stack : classes.root)} >
        {action !== 'invite' && (
          <Iframe url="https://www.uclusion.com"
                  id="myId"
                  width="2700px"
                  height="1300px"
                  scrolling="no"
                  display="initial"
                  frameBorder="0"
                  position="relative"/>
        )}
        {action === 'invite' && myMarket && (
          <div className={clsx(classes.paperNoTop, classes.centerColumn)}>
            <svg style={{ verticalAlign: 'middle', width: '140px', marginTop: '2rem', marginBottom: '-1rem' }}
                   xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 600">
                <path fill="#fff"
                      d="M888.67,328.66a43,43,0,0,1-34.38,42.12v43.84l-43-43H174.05a62.72,62.72,0,0,1-62.72-62.72V228.36a43,43,0,0,1,43-43H845.69a43,43,0,0,1,43,43Z"/>
                <path
                  d="M139.92,284.31V214.08h29v69.47c0,21.45,10.72,32.55,28.4,32.55s28.41-10.73,28.41-31.61V214.08h29v69.29c0,39.87-22.39,59.44-57.75,59.44S139.92,323.06,139.92,284.31Z"/>
                <path fill={LOGO_COLOR}
                      d="M265.85,290.81v-.38c0-28.78,22-52.48,52.86-52.48,19,0,30.85,6.4,40.25,16.93l-17.49,18.81c-6.39-6.77-12.79-11.1-23-11.1-14.29,0-24.45,12.61-24.45,27.47v.37c0,15.43,10,27.84,25.58,27.84,9.59,0,16.18-4.14,23.14-10.72l16.74,16.93c-9.78,10.72-21.07,18.43-41.2,18.43C288.05,342.91,265.85,319.59,265.85,290.81Z"/>
                <path fill={LOGO_COLOR} d="M368.18,209.86h28.59v130.8H368.18Z"/>
                <path fill={LOGO_COLOR}
                      d="M410.92,305.1V242.7h28.59v53.38c0,13.54,6.39,20.5,17.3,20.5s17.87-7,17.87-20.5V242.7h28.6v98h-28.6v-14.3c-6.58,8.46-15,16.18-29.53,16.18C423.52,342.54,410.92,328.24,410.92,305.1Z"/>
                <path fill={LOGO_COLOR}
                      d="M509.67,327.3l12.23-18.81c10.91,7.9,22.38,12,31.79,12,8.27,0,12-3,12-7.52v-.38c0-6.21-9.78-8.28-20.87-11.66-14.11-4.14-30.1-10.73-30.1-30.29v-.37c0-20.51,16.55-32,36.87-32A69.74,69.74,0,0,1,589.24,250l-10.91,19.75c-10-5.83-19.94-9.4-27.28-9.4-7,0-10.53,3-10.53,7v.37c0,5.65,9.59,8.28,20.5,12,14.11,4.7,30.47,11.48,30.47,29.91V310c0,22.38-16.74,32.54-38.56,32.54A70.67,70.67,0,0,1,509.67,327.3Z"/>
                <path fill={LOGO_COLOR} d="M602,242.7h28.59v98H602Z"/>
                <path fill={LOGO_COLOR}
                      d="M641.34,290.81v-.38c0-29,23.33-52.48,54.74-52.48,31.22,0,54.36,23.14,54.36,52.11v.37c0,29-23.32,52.48-54.74,52.48C664.48,342.91,641.34,319.78,641.34,290.81Zm80.89,0v-.38c0-14.86-10.73-27.84-26.53-27.84-16.36,0-26.14,12.61-26.14,27.47v.37c0,14.86,10.72,27.84,26.52,27.84C712.44,318.27,722.23,305.67,722.23,290.81Z"/>
                <path fill={LOGO_COLOR}
                      d="M759.85,242.7h28.59v11.43C795,245.66,803.49,238,818,238c21.63,0,34.23,14.3,34.23,37.43v65.28H823.61V284.41c0-13.54-6.39-20.5-17.3-20.5s-17.87,7-17.87,20.5v56.25H759.85Z"/>
                <rect fill={LOGO_COLOR} x="601.28" y="209.51" width="30.1" height="25.24"/>
                <path fill={LOGO_COLOR}
                      d="M845.69,171.05H154.31A57.38,57.38,0,0,0,97,228.36v80.56A77.06,77.06,0,0,0,174.05,386H805.37l38.78,38.78a14.32,14.32,0,0,0,24.46-10.13V381.17A57.4,57.4,0,0,0,903,328.66V228.36A57.38,57.38,0,0,0,845.69,171.05Zm43,157.61a43,43,0,0,1-34.38,42.12v43.84l-43-43H174.05a62.72,62.72,0,0,1-62.72-62.72V228.36a43,43,0,0,1,43-43H845.69a43,43,0,0,1,43,43Z"/>
              </svg>
              <Typography component="h1" variant="h2" className={clsx(classes.inviteText, classes.centerText, classes.marginTop)}>
                {intl.formatMessage({ id: 'signupInvite' }, { x: myMarket.created_by_name, y: myMarket.name })}
              </Typography>
          </div>
        )}
        <div className={myMarket ? classes.formRoot : clsx(classes.formRoot, classes.marginLeft)}>
          <div className={myMarket? clsx(classes.paperNoTop, classes.marginTop) : classes.paper}>
            { action !== 'invite' &&
              <Typography component="h1" variant="h5">
                {intl.formatMessage({ id: 'signupTitle' })}
              </Typography>
            }
          </div>
          <GithubLoginButton
            style={{
              lineHeight: '46px',
              display: 'inline-block',
              width: '100%',
              marginLeft: 'auto',
              marginRight: 'auto',
              fontSize: '1rem',
              marginTop: '2rem',
              paddingRight: '0px'
            }}
            align="center"
            onClick={() => {
              setRedirect(getRedirect());
              Auth.federatedSignIn({provider: 'GithubLogin'});
            }}>
              <div className={classes.textWrapper}>
                {intl.formatMessage({ id: 'signupGithubSignup' })}
              </div>
          </GithubLoginButton>
          <div className={classes.googleButton} onClick={() => {
            // Must come back to this device so go ahead and set in local storage
            setRedirect(getRedirect());
            Auth.federatedSignIn({provider: 'Google'});
          }}>
            <img className={classes.googleImg} alt="Sign in with Google" src={`/images/btn_google_dark_normal_ios.svg`} />
            <div className={classes.googleTextWrapper}>
              <div className={classes.googleText}> {intl.formatMessage({ id: 'signupGoogleSignup' })}</div>
            </div>
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
                    onBlur={onPasswordBlurred}
                    error={wasBlurred && password.length < 6}
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
                  <Link href="/" variant="body2"
                    onClick={(event) => {
                      event.preventDefault();
                      onStateChange('signIn');
                    }}
                  >
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
  action: PropTypes.string,
  marketToken: PropTypes.string,
  onStateChange: PropTypes.func,
};

Signup.defaultProps = {
  authState: '',
  action: '',
  marketToken: '',
  onStateChange: () => {},
};
export default Signup;