import React from 'react';
import Avatar from '@material-ui/core/Avatar';
import CssBaseline from '@material-ui/core/CssBaseline';
import TextField from '@material-ui/core/TextField';
import Link from '@material-ui/core/Link';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import { SignIn } from 'aws-amplify-react';
import { injectIntl } from 'react-intl';
import SpinningButton from '../components/SpinBlocking/SpinningButton';
import InputAdornment from '@material-ui/core/InputAdornment';
import IconButton from '@material-ui/core/IconButton';
import { Visibility, VisibilityOff } from '@material-ui/icons';

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
});

class CustomSignIn extends SignIn {
  state = {
    showPassword: false,
  }
  constructor(props) {
    super(props);
    this._validAuthStates = ['signIn', 'signedOut', 'signedUp'];
    this.onSubmit = this.onSubmit.bind(this);
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
        <form className={classes.form} onSubmit={this.onSubmit}>
          <div className={classes.hiddenSubmit}><input type="submit" tabIndex="-1"/></div>
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="username"
            key="username"
            name="username"
            onChange={this.handleInputChange}
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
                href="#"
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

export default withStyles(useStyles)(injectIntl(CustomSignIn));
