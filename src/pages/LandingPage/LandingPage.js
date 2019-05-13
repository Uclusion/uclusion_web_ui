import AppBar from '@material-ui/core/AppBar';
import IconButton from '@material-ui/core/IconButton';
import { ValidatorForm, TextValidator } from 'react-material-ui-form-validator';
import LockIcon from '@material-ui/icons/Lock';
import React, { useState, useEffect } from 'react';
import { injectIntl, FormattedHTMLMessage } from 'react-intl';
import Toolbar from '@material-ui/core/Toolbar';
import Tooltip from '@material-ui/core/Tooltip';
import { Helmet } from 'react-helmet';
import { withRouter } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';
import QuestionAnswerIcon from '@material-ui/icons/QuestionAnswer';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Info from '@material-ui/icons/Info';
import { AnonymousAuthorizer } from 'uclusion_authorizer_sdk';
import {
  Card,
  CardContent,
  Tabs,
  Tab,
  Button,
  Typography,
  CircularProgress,
} from '@material-ui/core';
import { getCurrentUser } from '../../store/Users/reducer';
import appConfig from '../../config/config';
import {
  setUclusionLocalStorageItem,
  getUclusionLocalStorageItem,
  clearAuth,
  setMarketAuth
} from '../../components/utils';
import { getClient } from '../../config/uclusionClient';
import { validURL } from '../../utils/validators';
import { sendIntlMessage, ERROR } from '../../utils/userMessage';
import CheckboxValidator from '../../components/ValidatorComponents/CheckboxValidator';
import HelpMovie from '../../components/ModalMovie/HelpMovie';


const LOGIN_GOOGLE = 0;
const LOGIN_OKTA = 1;
const LOGIN_COGNITO = 2;

const styles = theme => ({
  main: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  progressText: {
    marginTop: theme.spacing.unit,
    marginBottom: theme.spacing.unit,
  },
  errorText: {
    marginTop: theme.spacing.unit,
    marginBottom: theme.spacing.unit,
    color: '#f44336',
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
  progress: {
    display: 'block',
    margin: 'auto',
    marginTop: theme.spacing.unit,
  },
  button: {
    marginLeft: 0,
    padding: theme.spacing.unit * 0.5,
  },
});

function createMarket(client, accountCreationInfo, setLoading) {
  client.markets.createMarket({
    name: accountCreationInfo.marketName,
    description: accountCreationInfo.marketDescription,
    default_categories: true,
  }).then((market) => {
    if (accountCreationInfo.email) {
      // Un setting return auth token because need them to login again from email sent
      // (otherwise identity not confirmed)
      clearAuth();
      if (accountCreationInfo.isExistingLogin) {
        window.location = `${window.location.origin}/${market.market_id}/market`;
      } else {
        window.location = `${window.location.origin}/${market.market_id}/market?newLogin=true`;
      }
    } else {
      window.location = `${window.location.origin}/${market.market_id}/Login`;
    }
  }).catch((error) => {
    console.error(error);
    throw error;
  }).finally(() => {
    if (setLoading) {
      setLoading(false);
    }
  });
}

function LandingPage(props) {
  const [accountName, setAccountName] = useState(undefined);
  const [marketName, setMarketName] = useState(undefined);
  const [clientId, setClientId] = useState(undefined);
  const [loginType, setLoginType] = useState(LOGIN_COGNITO);
  const [processing, setProcessing] = useState(false);
  const [baseURL, setBaseURL] = useState(undefined);
  const [email, setEmail] = useState(undefined);
  const [name, setName] = useState(undefined);
  const [marketProductLoginUrl, setMarketProductLoginUrl] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progressMessage, setProgressMessage] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showSignupHelp, setShowSignupHelp] = useState(false);
  ValidatorForm.addValidationRule('isURL', value => !value || validURL(value));
  ValidatorForm.addValidationRule('isTruthy', value => value);
  const { intl } = props;

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
      setClientId(accountCreationInfo.clientId);
      setLoginType(accountCreationInfo.loginType);
      authorizer.doPostAccount(pageUrl).then((response) => {
        const authInfo = {
          token: response.login_capability, type: authorizer.getType(),
        };
        setMarketAuth('account', authInfo);
        return getClient();
      }).then((client) => {
        // https://forums.aws.amazon.com/thread.jspa?threadID=298683&tstart=0
        setTimeout(createMarket, 10000, client, accountCreationInfo);
      });
    }
    return () => {
    };
  }, []);

  function handleAccountNameChange(event) {
    setAccountName(event.target.value);
  }

  function handleMarketNameChange(event) {
    setMarketName(event.target.value);
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

  function handleAgreedToTermsChange(event) {
    setAgreedToTerms(event.target.checked);
  }

  function handleNameChange(event) {
    setName(event.target.value);
  }

  function handleMarketProductLoginUrlChange(event) {
    setMarketProductLoginUrl(event.target.value);
  }

  function getErrorMessage(e){
    if (e.error_message && e.error_message.error_message === 'Account name already exists'){
      return intl.formatMessage({ id: 'landingPageErrorAccountNameDuplicate' });
    }
    return 'Form invalid'; //this sucks
  }

  function handleSubmit(event) {
    event.preventDefault();
    const authorizer = new AnonymousAuthorizer({
      uclusionUrl: appConfig.api_configuration.baseURL,
    });
    const accountCreationInfo = {
      marketName, accountName, clientId, loginType, email, name,
    };
    if (loginType === LOGIN_COGNITO) {
      setLoading(true);
      setProgressMessage(intl.formatMessage({ id: 'landingPageCreatingYourAccount' }));
      authorizer.cognitoAccountCreate(accountCreationInfo)
        .then((response) => {
          const authInfo = {
            token: response.login_capability, type: authorizer.getType(),
          };
          accountCreationInfo.isExistingLogin = response.user.exists_in_cognito;
          // Have to set the return token or market creation will fail
          setMarketAuth('account', authInfo);
          return getClient();
        }).then(client => setTimeout(createMarket, 30000, client, accountCreationInfo, setLoading)) // https://forums.aws.amazon.com/thread.jspa?threadID=298683&tstart=0
        .catch((e) => {
          setLoading(false);
          setError(getErrorMessage(e));
          //sendIntlMessage(ERROR, { id: 'landingPageErrorSigningIn' });
          console.error(e);
        });
    } else {
      setLoading(true);
      setUclusionLocalStorageItem('accountCreationInfo', accountCreationInfo);
      authorizer.accountRedirect({
        uclusion_client_id: clientId,
        op_endpoint_base_url: loginType === LOGIN_GOOGLE ? 'https://accounts.google.com' : baseURL,
        account_name: accountName,
        team_name: `Team ${marketName}`,
        team_description: `${marketName} administrators`,
        redirect_url: `${window.location.href}`,
        oidc_type: loginType === LOGIN_GOOGLE ? 'GOOGLE' : 'OKTA',
      }).then((redirectUrl) => {
        window.location = redirectUrl;
      }).catch((e) => {
        sendIntlMessage(ERROR, { id: 'landingPageErrorSigningIn' });
        console.error(e);
      }).finally(() => {
        setLoading(false);
      });
    }
  }

  const { classes, theme, user } = props;
  return (
    <div className={classes.main}>
      <HelpMovie name="accountSignupHelp" open={showSignupHelp} onClose={() => setShowSignupHelp(false)} dontAutoOpen />
      <Helmet>
        <meta name="theme-color" content={theme.palette.primary.main}/>
        <meta name="apple-mobile-web-app-status-bar-style" content={theme.palette.primary.main}/>
        <meta name="msapplication-navbutton-color" content={theme.palette.primary.main}/>
        <title>{intl.formatMessage({ id: 'landingPageUclusionRegistration' })}</title>
      </Helmet>
      <AppBar position="static">
        <Toolbar disableGutters>
          <div style={{ flex: 1 }}/>
          {user && user.default_market_id && (
            <Tooltip title={intl.formatMessage({ id: 'landingPageSigninTooltip' })}>
              <IconButton
                name="signin"
                aria-label={intl.formatMessage({ id: 'landingPageOpenUclusion' })}
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
          <Tooltip title={intl.formatMessage({ id: 'landingPageHelpTooltip' })}>
            <IconButton
              name="questionanswer"
              aria-label={intl.formatMessage({ id: 'landingPageOpenUclusionHelp' })}
              color="inherit"
              href="https://uclusion.zendesk.com/hc/en-us"
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
              <Typography variant="h6">
                <Tooltip title={intl.formatMessage({ id: 'landingPageFormHelpTooltip' })}>

                  <IconButton
                    name="accountinfo"
                    aria-label="Account Help"
                    className={classes.button}
                    color="primary"
                    onClick={(event) => {
                      event.preventDefault();
                      setShowSignupHelp(true);
                    }}
                  >
                    <Info />
                  </IconButton>
                </Tooltip>
                {intl.formatMessage({ id: 'landingPageCreateAccountWith' })}
              </Typography>
              <Tabs
                className={classes.tabs}
                indicatorColor="primary"
                textColor="primary"
                variant="fullWidth"
                value={loginType}
                onChange={handleLoginTypeChange}
              >
                <Tab label={intl.formatMessage({ id: 'landingPageGoogle' })} />
                <Tab label={intl.formatMessage({ id: 'landingPageOkta' })} />
                <Tab label={intl.formatMessage({ id: 'landingPageCognito' })} />
              </Tabs>
              <ValidatorForm onSubmit={handleSubmit}>
                <Tooltip
                  title={
                    (
                      <React.Fragment>
                        <Typography variant="h5" color="inherit">{intl.formatMessage({ id: 'landingPageAccountNameTooltip' })}</Typography>
                      </React.Fragment>
                    )
                  }
                  placement="right-end"
                >
                  <TextValidator
                    className={classes.formField}
                    label={intl.formatMessage({ id: 'landingPageAccountName' })}
                    name="accountNameId"
                    validators={['required']}
                    errorMessages={[intl.formatMessage({ id: 'landingPageAccountNameError' })]}
                    fullWidth
                    value={accountName}
                    onChange={handleAccountNameChange}
                  />
                </Tooltip>
                <Tooltip
                  title={
                    (
                      <React.Fragment>
                        <Typography variant="h5" color="inherit">{intl.formatMessage({ id: 'landingPageMarketNameTooltip' })}</Typography>
                      </React.Fragment>
                    )
                  }
                  placement="right-end"
                >
                  <TextValidator
                    className={classes.formField}
                    label={intl.formatMessage({ id: 'landingPageMarketName' })}
                    name="marketNameId"
                    validators={['required']}
                    errorMessages={[intl.formatMessage({ id: 'landingPageMarketNameError' })]}
                    fullWidth
                    value={marketName}
                    onChange={handleMarketNameChange}
                  />
                </Tooltip>
                {loginType === LOGIN_COGNITO && (
                  <Tooltip
                    title={
                       (
                         <React.Fragment>
                           <Typography variant="h5" color="inherit">{intl.formatMessage({ id: 'landingPageEmailTooltip' })}</Typography>
                         </React.Fragment>
                       )
                     }
                    placement="right-end"
                  >
                    <TextValidator
                      className={classes.formField}
                      label={intl.formatMessage({ id: 'landingPageEmail' })}
                      name="email"
                      validators={['required', 'isEmail']}
                      errorMessages={[intl.formatMessage({ id: 'landingPageEmailErrorMissing' }), intl.formatMessage({ id: 'landingPageEmailErrorInvalid' })]}
                      fullWidth
                      value={email}
                      onChange={handleEmailChange}
                    />
                  </Tooltip>
                )}
                {loginType === LOGIN_COGNITO && (
                  <Tooltip
                    title={
                      (
                        <React.Fragment>
                          <Typography variant="h5" color="inherit">{intl.formatMessage({ id: 'landingPageNameTooltip' })}</Typography>
                        </React.Fragment>
                      )
                      }
                    placement="right-end"
                  >
                    <TextValidator
                      className={classes.formField}
                      label={intl.formatMessage({ id: 'landingPageName' })}
                      name="name"
                      validators={['required']}
                      errorMessages={[intl.formatMessage({ id: 'landingPageNameError' })]}
                      fullWidth
                      value={name}
                      onChange={handleNameChange}
                    />
                  </Tooltip>
                )}
                {loginType !== LOGIN_COGNITO && (
                  <Tooltip title={intl.formatMessage({ id: 'landingPageLoginUrlTooltip' })}>
                    <TextValidator
                      className={classes.formField}
                      label={intl.formatMessage({ id: 'landingPageLoginUrl' })}
                      name="marketProductLoginUrl"
                      validators={['isURL']}
                      errorMessages={[intl.formatMessage({ id: 'landingPageLoginUrlError' })]}
                      fullWidth
                      value={marketProductLoginUrl}
                      onChange={handleMarketProductLoginUrlChange}
                    />
                  </Tooltip>
                )}
                {loginType !== LOGIN_COGNITO && (
                  <Tooltip title={intl.formatMessage({ id: 'landingPageAuthorizationClientIdTooltip' })}>

                    <TextValidator
                      className={classes.formField}
                      label={intl.formatMessage({ id: 'landingPageAuthorizationClientId' })}
                      name="clientId"
                      validators={['required']}
                      errorMessages={[intl.formatMessage({ id: 'landingPageAuthorizationClientIdError' })]}
                      fullWidth
                      value={clientId}
                      onChange={handleClientIdChange}
                    />
                  </Tooltip>
                )}
                {loginType === LOGIN_OKTA && (
                  <Tooltip title={intl.formatMessage({ id: 'landingPageEndpointBaseUrlTooltip' })}>

                    <TextValidator
                      className={classes.formField}
                      label={intl.formatMessage({ id: 'landingPageEndpointBaseUrl' })}
                      name="baseURL"
                      validators={['required', 'isURL']}
                      errorMessages={[intl.formatMessage({ id: 'landingPageEndpointBaseUrlErrorMissing' }), intl.formatMessage({ id: 'landingPageEndpointBaseUrlErrorInvalid' })]}
                      fullWidth
                      value={baseURL}
                      onChange={handleBaseURLChange}
                    />
                  </Tooltip>
                )}
                <Typography className={classes.errorText}>{error}</Typography>

                {loading ? (
                  <div>
                    <Typography className={classes.progressText}>{progressMessage}</Typography>
                    <CircularProgress className={classes.progress}/>
                  </div>
                ) : (
                  <div>
                    <CheckboxValidator
                      validators={['isTruthy']}
                      errorMessages={[intl.formatMessage({ id: 'landingPageMustAgreeToTerms' })]}
                      value={agreedToTerms}
                      onChange={handleAgreedToTermsChange}
                      label={
                        <Typography><FormattedHTMLMessage
                          id="landingPageTermsLabel"
                          values={{ termsLink: appConfig.termsOfUseLink }}/>
                        </Typography>
                      }/>
                    <Button
                      className={classes.loginButton}
                      type="submit"
                      variant="contained"
                      color="primary"
                      fullWidth
                    >
                      {intl.formatMessage({ id: 'landingPageSubmit' })}
                    </Button>
                  </div>
                )}
              </ValidatorForm>
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
)(withRouter(withStyles(styles, { withTheme: true })(injectIntl(LandingPage))));
