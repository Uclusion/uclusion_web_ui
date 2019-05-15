import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import {
  AppBar,
  Toolbar,
  Button,
  Typography,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { ValidatorForm, TextValidator } from 'react-material-ui-form-validator';
import { injectIntl } from 'react-intl';
import { Helmet } from 'react-helmet';
import { getCurrentUser } from '../../store/Users/reducer';

const styles = theme => ({
  main: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  root: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    overflow: 'auto',
    backgroundColor: 'white',
    [theme.breakpoints.only('xs')]: {
      paddingTop: 0,
      paddingBottom: 0,
    },
    paddingTop: theme.spacing.unit * 4,
    paddingBottom: theme.spacing.unit * 4,
  },
  card: {
    overflow: 'unset',
    width: 480,
    maxWidth: '100%',
    [theme.breakpoints.only('xs')]: {
      boxShadow: 'none',
    },
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  logo: {
    width: 300,
    height: 300,
  },
  form: {
    width: '100%',
  },
  input: {
    display: 'block',
    marginBottom: theme.spacing.unit * 2,
  },
  errorText: {
    marginTop: theme.spacing.unit,
    marginBottom: theme.spacing.unit,
    color: '#f44336',
  },
});

function MarketsPage(props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const { intl } = props;
  const { classes, theme } = props;

  function loginCognito() {
    setProcessing(true);
    setError('fix build cause complained unused');
    // const { marketId, uclusionUrl } = getLoginParams();
    // const authorizerConfiguration = {
    //   username: email,
    //   password,
    //   poolId,
    //   clientId,
    //   marketId,
    //   baseURL: uclusionUrl,
    // };
    // cognitoAuthorizer = new CognitoAuthorizer(authorizerConfiguration);
    // setError('');
    // cognitoAuthorizer.authorize().then((response) => {
    //   console.debug(response);
    //   cognitoTokenGenerated(props, response, cognitoAuthorizer, () => { setProcessing(false); });
    // }).catch((error) => {
    //   if ('newPasswordRequired' in error && error.newPasswordRequired) {
    //     if (newPassword) {
    //       changePasswordCognito(cognitoAuthorizer);
    //     } else {
    //       setIsNewRegistration(true);
    //       setHelpMessage(intl.formatMessage({ id: 'loginNewRegistrationExplanation' }));
    //       setNewPassword('');
    //       setConfirmPassword('');
    //     }
    //   } else {
    //     getErrorMessage(error)
    //       .then((errorString) => {
    //         setProcessing(false);
    //         setError(errorString);
    //       });
    //   }
    // });
  }

  return (
    <div className={classes.main}>
      <Helmet>
        <meta name="theme-color" content={theme.palette.primary.main} />
        <meta name="apple-mobile-web-app-status-bar-style" content={theme.palette.primary.main} />
        <meta name="msapplication-navbutton-color" content={theme.palette.primary.main} />
        <title>{intl.formatMessage({ id: 'chooseMarket' })}</title>
      </Helmet>
      <AppBar position="static">
        <Toolbar disableGutters />
      </AppBar>

      <div className={classes.root}>
        <Card className={classes.card}>
          <CardContent>
            <div className={classes.content}>
              <img
                className={classes.logo}
                src="/watermark.png"
                alt="Uclusion Logo"
              />
              <FormControl className={classes.input} fullWidth>
                <InputLabel htmlFor="market">Select Market</InputLabel>
                <Select
                  fullWidth
                  inputProps={{
                    name: 'market',
                    id: 'market',
                  }}
                >
                  <MenuItem value="market1">
                    Market1
                  </MenuItem>
                  <MenuItem value="market2">
                    Market2
                  </MenuItem>
                  <MenuItem value="market3">
                    Market3
                  </MenuItem>
                </Select>
              </FormControl>
              <ValidatorForm className={classes.form} onSubmit={loginCognito}>
                <TextValidator
                  className={classes.input}
                  label={intl.formatMessage({ id: 'loginEmail' })}
                  name="email"
                  validators={['required', 'isEmail']}
                  errorMessages={[intl.formatMessage({ id: 'loginErrorEmailMissing' }), intl.formatMessage({ id: 'loginErrorEmailInvalid' })]}
                  fullWidth
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                />
                <TextValidator
                  className={classes.input}
                  label={intl.formatMessage({ id: 'loginPassword' })}
                  name="password"
                  type="password"
                  validators={['required']}
                  errorMessages={[intl.formatMessage({ id: 'loginErrorPasswordMissing' })]}
                  fullWidth
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                />
                <Typography className={classes.errorText}>{error}</Typography>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={processing}
                  fullWidth
                >
                  {intl.formatMessage({ id: 'loginLoginCognitoButton' })}
                </Button>
              </ValidatorForm>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

MarketsPage.propTypes = {
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
  user: PropTypes.object,
  intl: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
  user: getCurrentUser(state.usersReducer),
});

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withRouter(withStyles(styles, { withTheme: true })(injectIntl(MarketsPage))));
