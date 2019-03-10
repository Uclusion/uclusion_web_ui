import AppBar from '@material-ui/core/AppBar';
import IconButton from '@material-ui/core/IconButton';
import LockIcon from '@material-ui/icons/Lock';
import React, { useState, useEffect } from 'react';
import Toolbar from '@material-ui/core/Toolbar';
import Tooltip from '@material-ui/core/Tooltip';
import { Helmet } from 'react-helmet';
import { withRouter } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';
import QuestionAnswerIcon from '@material-ui/icons/QuestionAnswer';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { AnonymousAuthorizer } from 'uclusion_authorizer_sdk';
import {
  Card,
  CardContent,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Input,
  Button,
  Typography,
} from '@material-ui/core';
import { getCurrentUser } from '../../store/Users/reducer';
import appConfig from '../../config/config';
import { setUclusionLocalStorageItem, getUclusionLocalStorageItem } from '../../components/utils';
import { getClient } from '../../config/uclusionClient';

const LOGIN_GOOGLE = 0;
const LOGIN_OKTA = 1;
const LOGIN_COGNITO = 2;

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
  tabs: {
    [theme.breakpoints.only('xs')]: {
      alignSelf: 'stretch',
    },
  },
  logo: {
    width: 300,
    height: 300,
  },
  formField: {
    marginBottom: theme.spacing.unit,
  },
  loginButton: {
    marginTop: theme.spacing.unit,
  },
});

function createMarket(client, accountCreationInfo) {
  client.markets.createMarket({
    name: accountCreationInfo.marketName,
    description: accountCreationInfo.marketDescription,
  }).then((market) => {
    if (accountCreationInfo.email) {
      // Un setting return auth token because need them to login again from email sent
      // (otherwise identity not confirmed)
      setUclusionLocalStorageItem('auth', null);
      window.location = `${window.location.origin}/${market.market_id}/marketCategories?newLogin=true`;
    } else {
      window.location = `${window.location.origin}/${market.market_id}/marketCategories`;
    }
  })
    .catch((error) => {
      console.error(error);
      throw error;
    });
}

function LandingPage(props) {
  const [accountName, setAccountName] = useState(undefined);
  const [marketName, setMarketName] = useState(undefined);
  const [marketDescription, setMarketDescription] = useState(undefined);
  const [clientId, setClientId] = useState(undefined);
  const [loginType, setLoginType] = useState(LOGIN_COGNITO);
  const [processing, setProcessing] = useState(false);
  const [baseURL, setBaseURL] = useState(undefined);
  const [email, setEmail] = useState(undefined);
  const [name, setName] = useState(undefined);
  const [marketProductLoginUrl, setMarketProductLoginUrl] = useState(undefined);

  useEffect(() => {
    const authorizer = new AnonymousAuthorizer({
      uclusionUrl: appConfig.api_configuration.baseURL,
    });
    const pageUrl = window.location.href;
    if (authorizer.amIOnPostAuthorizePage(pageUrl) && !processing) {
      setProcessing(true);
      const accountCreationInfo = getUclusionLocalStorageItem('accountCreationInfo');
      setAccountName(accountCreationInfo.accountName);
      setMarketName(accountCreationInfo.marketName);
      setMarketDescription(accountCreationInfo.marketDescription);
      setClientId(accountCreationInfo.clientId);
      setLoginType(accountCreationInfo.loginType);
      authorizer.doPostAccount(pageUrl).then((response) => {
        const authInfo = {
          token: response.login_capability, type: authorizer.getType(),
        };
        setUclusionLocalStorageItem('auth', authInfo);
        return getClient();
      }).then((client) => {
        // https://forums.aws.amazon.com/thread.jspa?threadID=298683&tstart=0
        setTimeout(createMarket, 10000, client, accountCreationInfo);
      });
    }
    return () => {};
  });
  function handleAccountNameChange(event) {
    setAccountName(event.target.value);
  }

  function handleMarketNameChange(event) {
    setMarketName(event.target.value);
  }

  function handleMarketDescriptionChange(event) {
    setMarketDescription(event.target.value);
  }

  function handleClientIdChange(event) {
    setClientId(event.target.value);
  }

  function handleLoginTypeChange(event, value) {
    setLoginType(value);
  }

  function handleBaseURLChange(event) {
    setBaseURL(event.target.value);
  }

  function handleEmailChange(event) {
    setEmail(event.target.value);
  }

  function handleNameChange(event) {
    setName(event.target.value);
  }

  function handleMarketProductLoginUrlChange(event) {
    setMarketProductLoginUrl(event.target.value);
  }

  function handleSubmit(event) {
    event.preventDefault();
    const authorizer = new AnonymousAuthorizer({
      uclusionUrl: appConfig.api_configuration.baseURL,
    });
    const accountCreationInfo = {
      marketName, marketDescription, accountName, clientId, loginType, email, name,
    };
    if (loginType === LOGIN_COGNITO) {
      authorizer.cognitoAccountCreate(accountCreationInfo)
        .then((response) => {
          const authInfo = {
            token: response.login_capability, type: authorizer.getType(),
          };
          // Have to set the return token or market creation will fail
          setUclusionLocalStorageItem('auth', authInfo);
          return getClient();
        }).then((client) => {
          console.log('Now pausing before create market so will need spinner');
          // https://forums.aws.amazon.com/thread.jspa?threadID=298683&tstart=0
          setTimeout(createMarket, 10000, client, accountCreationInfo);
        });
    } else {
      setUclusionLocalStorageItem('accountCreationInfo', accountCreationInfo);
      authorizer.accountRedirect({
        uclusion_client_id: clientId,
        op_endpoint_base_url: loginType === LOGIN_GOOGLE ? 'https://accounts.google.com' : baseURL,
        account_name: accountName,
        team_name: `Team ${marketName}`,
        team_description: `${marketName} administrators`,
        redirect_url: `${window.location.href}`,
        oidc_type: loginType,
      }).then((redirectUrl) => {
        window.location = redirectUrl;
      }).catch((reject) => {
        console.error(reject);
      });
    }
  }

  const { classes, theme, user } = props;

  return (
    <div className={classes.main}>
      <Helmet>
        <meta name="theme-color" content={theme.palette.primary.main} />
        <meta name="apple-mobile-web-app-status-bar-style" content={theme.palette.primary.main} />
        <meta name="msapplication-navbutton-color" content={theme.palette.primary.main} />
        <title>Uclusion Registration</title>
      </Helmet>
      <AppBar position="static">
        <Toolbar disableGutters>
          <div style={{ flex: 1 }} />
          {user && user.default_market_id && (
          <Tooltip id="tooltip-icon1" title="Sign in">
            <IconButton
              name="signin"
              aria-label="Open Uclusion"
              color="inherit"
              onClick={() => {
                window.location = `${window.location.href}${user.default_market_id}/Login`;
              }}
              rel="noopener"
            >
              <LockIcon />
            </IconButton>
          </Tooltip>
          )}
          <Tooltip id="tooltip-icon2" title="Uclusion website">
            <IconButton
              name="questionanswer"
              aria-label="Open Uclusion Website"
              color="inherit"
              href="https://www.uclusion.com"
              target="_blank"
              rel="noopener"
            >
              <QuestionAnswerIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
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
              <Typography variant="h6">CREATE ACCOUNT WITH:</Typography>
              <Tabs
                className={classes.tabs}
                indicatorColor="primary"
                textColor="primary"
                variant="fullWidth"
                value={loginType}
                onChange={handleLoginTypeChange}
              >
                <Tab label="Google" />
                <Tab label="OKTA" />
                <Tab label="Cognito" />
              </Tabs>
              <form onSubmit={handleSubmit}>
                <FormControl className={classes.formField} fullWidth>
                  <InputLabel htmlFor="accountNameId">Account Name:</InputLabel>
                  <Input
                    id="accountNameId"
                    value={accountName}
                    onChange={handleAccountNameChange}
                  />
                </FormControl>
                <FormControl className={classes.formField} fullWidth>
                  <InputLabel htmlFor="marketNameId">Market Name:</InputLabel>
                  <Input
                    id="marketNameId"
                    value={marketName}
                    onChange={handleMarketNameChange}
                  />
                </FormControl>
                <FormControl className={classes.formField} fullWidth>
                  <InputLabel htmlFor="marketDescriptionId">Market Description:</InputLabel>
                  <Input
                    id="marketDescriptionId"
                    value={marketDescription}
                    onChange={handleMarketDescriptionChange}
                  />
                </FormControl>
                <FormControl className={classes.formField} fullWidth>
                  <InputLabel htmlFor="marketProductLoginUrl">Optional Product Login URL:</InputLabel>
                  <Input
                    id="marketProductLoginUrl"
                    value={marketProductLoginUrl}
                    onChange={handleMarketProductLoginUrlChange}
                  />
                </FormControl>
                {loginType === LOGIN_COGNITO && (
                  <FormControl className={classes.formField} fullWidth>
                    <InputLabel htmlFor="email">Email:</InputLabel>
                    <Input
                      id="email"
                      value={email}
                      onChange={handleEmailChange}
                    />
                  </FormControl>
                )}
                {loginType === LOGIN_COGNITO && (
                  <FormControl className={classes.formField} fullWidth>
                    <InputLabel htmlFor="name">Name:</InputLabel>
                    <Input
                      id="name"
                      value={name}
                      onChange={handleNameChange}
                    />
                  </FormControl>
                )}
                {loginType !== LOGIN_COGNITO && (
                  <FormControl className={classes.formField} fullWidth>
                    <InputLabel htmlFor="clientId">Authorization Client ID:</InputLabel>
                    <Input
                      id="clientId"
                      value={clientId}
                      onChange={handleClientIdChange}
                    />
                  </FormControl>
                )}
                {loginType === LOGIN_OKTA && (
                  <FormControl className={classes.formField} fullWidth>
                    <InputLabel htmlFor="baseURL">Endpoint Base URL:</InputLabel>
                    <Input
                      id="baseURL"
                      value={baseURL}
                      onChange={handleBaseURLChange}
                    />
                  </FormControl>
                )}
                <Button
                  className={classes.loginButton}
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                >
                  Log In
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

LandingPage.propTypes = {
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
  user: PropTypes.object,
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
)(withRouter(withStyles(styles, { withTheme: true })(LandingPage)));
