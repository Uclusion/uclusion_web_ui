import React, { useState, useEffect } from 'react';
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
import {
  CognitoAuthorizer,
  UclusionSSO,
} from 'uclusion_authorizer_sdk';
import { withBackgroundProcesses } from '../../components/BackgroundProcesses/BackgroundProcessWrapper';
import appConfig from '../../config/config';
import { cognitoTokenGenerated, getErrorMessage } from '../../utils/loginFunctions';
import { setMarketAuth } from '../../components/utils';
import { getCurrentUser } from '../../store/Users/reducer';
import { clearUserState } from "../../utils/userStateFunctions";

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
  const [markets, setMarkets] = useState(undefined);
  const [selectedMarket, setSelectedMarket] = useState('');

  const { intl, history, classes, theme, currentUser, allCategories, dispatch } = props;

  function changeMarket(event) {
    setSelectedMarket(event.target.value);
  }

  useEffect(() => {
    // zero us if we just arrived
    if (!selectedMarket) {
      clearUserState(dispatch);
    }
    if (currentUser && selectedMarket && allCategories) {
      history.push(`${selectedMarket}/investibles`);
    }
  }, [currentUser, allCategories]);

  function loginCognito() {
    setProcessing(true);
    setError('');
    const authorizerConfiguration = {
      username: email,
      password,
      poolId: appConfig.api_configuration.poolId,
      clientId: appConfig.api_configuration.clientId,
      baseURL: appConfig.api_configuration.baseURL,
    };
    const cognitoAuthorizer = new CognitoAuthorizer(authorizerConfiguration);
    const uclusionSSO = new UclusionSSO(appConfig.api_configuration.baseURL);
    cognitoAuthorizer.authorize().then(token => uclusionSSO.loginsInfo(token))
      .then((response) => {
        setProcessing(false);
        const markets = Object.keys(response).map(
          marketId => ({ value: marketId, name: response[marketId].name }),
        );
        setMarkets(markets);
        return response;
      }).catch((error) => {
        getErrorMessage(error)
          .then((errorString) => {
            setProcessing(false);
            setError(errorString);
          });
      });
  }

  function loginCognitoWithMarket(event) {
    event.preventDefault();
    setProcessing(true);
    setError('');
    const authorizerConfiguration = {
      username: email,
      password,
      poolId: appConfig.api_configuration.poolId,
      clientId: appConfig.api_configuration.clientId,
      marketId: selectedMarket,
      baseURL: appConfig.api_configuration.baseURL,
    };
    const cognitoAuthorizer = new CognitoAuthorizer(authorizerConfiguration);
    cognitoAuthorizer.authorize().then((response) => {
      const authInfo = {
        token: response.uclusion_token, type: cognitoAuthorizer.getType(),
      };
      setMarketAuth('account', authInfo);
      cognitoTokenGenerated(props, response, cognitoAuthorizer, () => { setProcessing(false); },
        true);
    }).catch((error) => {
      getErrorMessage(error)
        .then((errorString) => {
          setProcessing(false);
          setError(errorString);
        });
    });
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
              {markets ? (
                <div style={{ width: '100%' }}>
                  <FormControl className={classes.input} fullWidth>
                    <InputLabel htmlFor="market">Select Market</InputLabel>
                    <Select
                      fullWidth
                      inputProps={{
                        name: 'market',
                        id: 'market',
                      }}
                      value={selectedMarket}
                      onChange={changeMarket}
                    >
                      {markets.map(({ name, value }) => (
                        <MenuItem key={value} value={value}>
                          {name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Typography className={classes.errorText}>{error}</Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={!selectedMarket || processing}
                    fullWidth
                    onClick={loginCognitoWithMarket}
                  >
                    {intl.formatMessage({ id: 'continue' })}
                  </Button>
                </div>
              ) : (
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
              )}
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
  intl: PropTypes.object.isRequired,
};

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

function mapStateToProps(state) {
  return { ...state,
    currentUser: getCurrentUser(state.usersReducer),
    allCategories: state.marketsReducer.marketCategories
  };
}

export default withBackgroundProcesses(connect(
  mapStateToProps,
  mapDispatchToProps,
)(withRouter(withStyles(styles, { withTheme: true })(injectIntl(MarketsPage)))));
