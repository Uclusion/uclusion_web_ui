import React from 'react'
import Avatar from '@material-ui/core/Avatar'
import CssBaseline from '@material-ui/core/CssBaseline'
import TextField from '@material-ui/core/TextField'
import Link from '@material-ui/core/Link'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'
import Container from '@material-ui/core/Container'
import { SignIn } from 'aws-amplify-react'
import { injectIntl } from 'react-intl'
import SpinningButton from '../components/SpinBlocking/SpinningButton'
import { GithubLoginButton } from 'react-social-login-buttons'
import InputAdornment from '@material-ui/core/InputAdornment'
import IconButton from '@material-ui/core/IconButton'
import { Visibility, VisibilityOff } from '@material-ui/icons'
import { Auth } from 'aws-amplify'
import { withRouter } from 'react-router';
import { redirectFromHistory, setRedirect } from '../utils/redirectUtils'
import { clearSignedOut, isSignedOut } from '../utils/userFunctions'

const useStyles = (theme) => ({
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
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
    backgroundColor: '#3f6b72',
    color: '#fff',
  },
  hiddenSubmit: {
    border: '0 none',
    height: 0,
    width: 0,
    padding: 0,
    margin: 0,
    overflow: 'hidden',
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
  githubText: {
    lineHeight: '46px',
    display: 'inline-block',
    width: 'auto',
    marginLeft: 'auto',
    marginRight: 'auto',
    fontSize: '1rem'
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
  }
});

class CustomSignIn extends SignIn {
  state = {
    showPassword: false,
  }

  setLoginRedirect(){
    const { history } = this.props;
    const redirect = redirectFromHistory(history);
    if (redirect) {
      console.info(`Redirecting to ${redirect}`);
      setRedirect(redirect);
    }
  }
  constructor(props) {
    if (isSignedOut()) {
      clearSignedOut();
    }
    super(props);
    const { defaultEmail } = props;
    this._validAuthStates = ['signIn', 'signedOut', 'signedUp'];
    this.onSubmit = this.onSubmit.bind(this);
    if (defaultEmail) {
      this.defaultEmail = defaultEmail;
      this.getUsernameFromInput = () => defaultEmail;
    }
  }

  onSubmit(form) {
    form.preventDefault();
    super.signIn();
  }

  showComponent() {
    const { classes, intl } = this.props;
    const ALTERNATE_SIDEBAR_LOGO = 'Uclusion_Logo_White_Micro.png';

    return (
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <div className={classes.paper}>
          <Avatar className={classes.avatar}>
            <img width="35" height="35" src={`/images/${ALTERNATE_SIDEBAR_LOGO}`} alt="Uclusion" />
          </Avatar>
          <Typography component="h1" variant="h5">
            {intl.formatMessage({ id: 'signInSignIn' })}
          </Typography>
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
            this.setLoginRedirect();
            Auth.federatedSignIn({provider: 'GithubLogin'})
          }}>
            <div className={classes.textWrapper}>{intl.formatMessage({id: 'signInGithubSignIn'})}</div>
        </GithubLoginButton>
        <div className={classes.googleButton} onClick={() => {
          this.setLoginRedirect();
          Auth.federatedSignIn({provider: 'Google'})
        }}>
          <img className={classes.googleImg} alt="Sign in with Google" src={`/images/btn_google_dark_normal_ios.svg`} />
          <div className={classes.googleTextWrapper}>
            <div className={classes.googleText}>{intl.formatMessage({id: 'signInGoogleSignIn'})}</div>
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
        <form className={classes.form} onSubmit={this.onSubmit}>
          <div className={classes.hiddenSubmit}><input type="submit" tabIndex="-1"/></div>
          <TextField
            ref={this.ref}
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="username"
            key="username"
            name="username"
            onChange={this.handleInputChange}
            defaultValue={this.defaultEmail}
            disabled={this.defaultEmail !== undefined}
            type="email"
            label={intl.formatMessage({ id: 'signInEmailLabel' })}
            autoComplete="email"
            autoFocus
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="password"
            label={intl.formatMessage({ id: 'signInPasswordLabel' })}
            key="password"
            type={this.state.showPassword ? 'text' : 'password'}
            id="password"
            onChange={this.handleInputChange}
            autoComplete="current-password"
            InputProps={{
              endAdornment:
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => this.setState({showPassword: !this.state.showPassword})}
                  onMouseDown={(event) => event.preventDefault()}
                  >
                  {this.state.showPassword ? <Visibility /> : <VisibilityOff />}
                </IconButton>
              </InputAdornment>,
            }}
          />
          <SpinningButton
            type="submit"
            spinning={this.state.loading}
            fullWidth
            variant="contained"
            className={classes.submit}
            id="signinButton"
            doSpin={false}
          >
            {intl.formatMessage({ id: 'signInSignIn'})}
          </SpinningButton>
          <Grid container>
            <Grid item xs>
              <Link
                href="#"
                variant="body2"
                onClick={() => super.changeState('forgotPassword', { email: super.getUsernameFromInput() })}
              >
                {intl.formatMessage({ id: 'signInForgotPassword' })}
              </Link>
            </Grid>
            <Grid item>
              <Link
                href={window.location.href}
                variant="body2"
                onClick={(e) => {
                  e.preventDefault();
                  super.changeState('signUp');
                }}
              >
                {intl.formatMessage({ id: 'signInNoAccount' })}
              </Link>
            </Grid>
          </Grid>
        </form>
      </Container>
    );
  }
}

export default withStyles(useStyles)(withRouter(injectIntl(CustomSignIn)));
