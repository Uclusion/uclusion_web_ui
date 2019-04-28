/* eslint-disable react/forbid-prop-types */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { ValidatorForm, TextValidator } from 'react-material-ui-form-validator';
import {
  OidcAuthorizer,
  SsoAuthorizer,
  AnonymousAuthorizer,
  CognitoAuthorizer,
} from 'uclusion_authorizer_sdk';
import {
  Button,
  Dialog,
  DialogTitle,
  List,
  ListItem, Tooltip,
  Typography,
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import appConfig from '../../config/config';
import { getAuthMarketId, formCurrentMarketLink, getMarketId } from '../../utils/marketIdPathFunctions';
import { postAuthTasks } from '../../utils/postAuthFunctions';
import { withBackgroundProcesses } from '../../components/BackgroundProcesses/BackgroundProcessWrapper';
import { setUclusionLocalStorageItem } from '../../components/utils';

const styles = theme => ({
  content: {
    width: 360,
  },
  form: {
    width: '100%',
  },
  input: {
    display: 'block',
    marginBottom: theme.spacing.unit * 2,
  },
  noVertPadding: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  separator: {
    width: '100%',
    height: 1,
    backgroundColor: theme.palette.grey[400],
  },
  hidden: {
    display: 'none',
  },
  errorText: {
    marginTop: theme.spacing.unit,
    marginBottom: theme.spacing.unit,
    color: '#f44336',
  },
  helpText: {
    marginLeft: theme.spacing.unit * 2,
  },
});

let cognitoAuthorizer = null;

function LoginModal(props) {
  const [allowGuestLogin, setAllowGuestLogin] = useState(false);
  const [allowCognitoLogin, setAllowCognitoLogin] = useState(false);
  const [allowUserLogin, setAllowUserLogin] = useState(false);
  const [allowOidcLogin, setAllowOidcLogin] = useState(false);
  const [isNewRegistration, setIsNewRegistration] = useState(false);
  const [allowResetPassword, setAllowResetPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [poolId, setPoolId] = useState('');
  const [clientId, setClientId] = useState('');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const {
    intl, classes, open,
  } = props;

  ValidatorForm.addValidationRule('isPasswordMatch', value => (value === newPassword));

  function getDestinationPage(subPath, includeAuthMarket) {
    const currentPage = new URL(window.location.href);
    let authMarketId;
    if (currentPage.search.includes('authMarketId')) {
      const parsed = currentPage.search.substr(currentPage.search.indexOf('authMarketId'));
      authMarketId = parsed.split('=')[1];
    }
    const marketId = includeAuthMarket || !authMarketId ? getMarketId() : authMarketId;
    currentPage.pathname = `/${marketId}/${subPath}`;
    currentPage.search = authMarketId && includeAuthMarket ? `authMarketId=${authMarketId}` : '';
    return currentPage.toString();
  }

  const getPostAuthPage = () => {
    const currentPage = new URL(window.location.href);
    currentPage.pathname = '/post_auth';
    currentPage.search = '';
    return currentPage.toString();
  };

  function getLoginParams() {
    const marketId = getAuthMarketId();
    const parsed = new URL(window.location.href);
    let page = parsed.searchParams.get('destinationPage') || 'investibles';
    if (parsed.href.includes('#')) {
      page += `#${parsed.href.split('#')[1]}`;
    }
    const newLogin = parsed.searchParams.get('newLogin');
    const destinationPage = getDestinationPage(page, true);
    const redirectUrl = getPostAuthPage();
    const pageUrl = window.location.href;
    const uclusionUrl = appConfig.api_configuration.baseURL;
    console.debug(`page = ${page}`);
    console.debug(`destinationPage = ${destinationPage}`);
    console.debug(`redirectUrl = ${redirectUrl}`);
    return {
      marketId,
      destinationPage,
      redirectUrl,
      pageUrl,
      uclusionUrl,
      newLogin,
      page,
    };
  }

  useEffect(() => {
    const loginParams = getLoginParams();
    const authorizer = new AnonymousAuthorizer(loginParams);
    authorizer.marketLoginInfo().then((response) => {
      setUclusionLocalStorageItem('loginInfo', response);
      setAllowCognitoLogin(response.allow_cognito);
      setAllowGuestLogin(response.allow_anonymous);
      setAllowUserLogin(response.allow_user);
      setAllowOidcLogin(response.allow_oidc);
      if (response.allow_cognito) {
        setPoolId(response.user_pool_id);
        setClientId(response.cognito_client_id);
        const { newLogin } = loginParams;
        if (newLogin && response.allow_cognito) {
          setIsNewRegistration(true);
        }
      }
    });
    return () => {
    };
  }, []);

  function doLoginRedirect(authorizer, loginParams) {
    const { pageUrl, destinationPage, redirectUrl } = loginParams;
    const redirectPromise = authorizer.authorize(pageUrl, destinationPage, redirectUrl);
    redirectPromise.then((location) => {
      console.debug(location);
      window.location = location;
    });
  }

  function loginOidc() {
    const loginParams = getLoginParams();
    const authorizer = new OidcAuthorizer(loginParams);
    doLoginRedirect(authorizer, loginParams);
  }

  function loginSso() {
    const loginParams = getLoginParams();
    const authorizer = new SsoAuthorizer(loginParams);
    doLoginRedirect(authorizer, loginParams);
  }

  function cognitoTokenGenerated(response) {
    const { dispatch, webSocket, history, usersReducer } = props;
    const { marketId, page } = getLoginParams();
    console.log(response);
    postAuthTasks(usersReducer, response.deployed_version, cognitoAuthorizer.storedToken, cognitoAuthorizer.getType(), dispatch,
      marketId, cognitoAuthorizer.user, webSocket);
    setProcessing(false);
    history.push(page);
  }

  function changePasswordCognito() {
    cognitoAuthorizer.completeNewPasswordChallenge(newPassword)
      .then(() => {
        cognitoTokenGenerated();
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function loginCognito() {
    setProcessing(true);
    const { marketId, uclusionUrl } = getLoginParams();
    const authorizerConfiguration = {
      username: email,
      password,
      poolId,
      clientId,
      marketId,
      baseURL: uclusionUrl,
    };
    cognitoAuthorizer = new CognitoAuthorizer(authorizerConfiguration);
    setError('');
    cognitoAuthorizer.authorize().then((response) => {
      console.log(response);
      cognitoTokenGenerated(response);
    }).catch((error) => {
      if ('newPasswordRequired' in error && error.newPasswordRequired) {
        if (newPassword) {
          changePasswordCognito();
        } else {
          setIsNewRegistration(true);
          setNewPassword('');
          setConfirmPassword('');
        }
      } else {
        setProcessing(false);
        setError(getErrorMessage(error));
        console.error(error);
      }
    });
  }

  function getErrorMessage(error){
    switch (error.name) {
      case 'UserNotFoundException':
        return intl.formatMessage({ id: 'loginErrorUserNotFound' });
      default:
        return error.message;
    }
  }

  function forgotCognitoPassword() {
    const { marketId, uclusionUrl } = getLoginParams();
    const authorizerConfiguration = {
      username: email,
      poolId,
      clientId,
      marketId,
      baseURL: uclusionUrl,
    };
    cognitoAuthorizer = new CognitoAuthorizer(authorizerConfiguration);
    setError('');
    cognitoAuthorizer.forgotPassword().then(() => {
      setAllowResetPassword(true);
      setCode('');
      setNewPassword('');
      setConfirmPassword('');
    }).catch((error) => {
      setError(getErrorMessage(error));
      console.error(error);
    });
  }

  function resetCognitoPassword() {
    setError('');
    cognitoAuthorizer.confirmPassword(code, newPassword).then(() => {
      setAllowResetPassword(false);
    }).catch((error) => {
      setError(error.message);
      console.log(error);
    });
  }

  function loginAnonymous() {
    const { dispatch, history, webSocket, usersReducer } = props;
    const loginParams = getLoginParams();
    const authorizer = new AnonymousAuthorizer(loginParams);
    authorizer.doPostAuthorize().then((resolve) => {
      const {
        uclusion_token, market_id, user, deployed_version,
      } = resolve;
      postAuthTasks(usersReducer, deployed_version, uclusion_token, authorizer.getType(), dispatch, market_id, user, webSocket);
      history.push(formCurrentMarketLink('investibles'));
    });
  }

  function signup() {
    const { history } = props;
    history.push(formCurrentMarketLink('NewCognito'));
  }

  function getNewPasswordField() {
    return (
      <Tooltip title={intl.formatMessage({ id: 'loginNewPasswordToolTip' })}>

        <TextValidator
          className={classes.input}
          label={intl.formatMessage({ id: 'loginNewPassword' })}
          name="new_password"
          type="password"
          validators={['required', 'matchRegexp:^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})']}
          errorMessages={[intl.formatMessage({ id: 'loginNewPasswordMissing' }), intl.formatMessage({ id: 'loginNewPasswordErrorInvalid' })]}
          fullWidth
          value={newPassword}
          onChange={event => setNewPassword(event.target.value)}
        />
      </Tooltip>
    );
  }

  function getConfirmPasswordField() {
    return (
      <TextValidator
        className={classes.input}
        label={intl.formatMessage({ id: 'loginConfirmPassword' })}
        name="confirm_password"
        type="password"
        validators={['isPasswordMatch', 'required']}
        errorMessages={[intl.formatMessage({ id: 'loginConfirmPasswordErrorNoMatch' }), intl.formatMessage({ id: 'loginConfirmPasswordErrorMissing' })]}
        fullWidth
        value={confirmPassword}
        onChange={event => setConfirmPassword(event.target.value)}
      />
    );
  }


  return (
    <Dialog onClose={() => null} aria-labelledby="simple-dialog-title" open={open}>
      <DialogTitle id="simple-dialog-title">
        {isNewRegistration && (intl.formatMessage({ id: 'loginCompleteRegistration' }))}
        {allowResetPassword && (intl.formatMessage({ id: 'reset_password_header' }))}
        {!allowResetPassword && !isNewRegistration && (intl.formatMessage({ id: 'login_header' }))}
      </DialogTitle>
      <List className={classes.content}>
        {allowResetPassword && (
          <Typography className={classes.helpText}>
            {intl.formatMessage({ id: 'check_email_code' })}
          </Typography>
        )}
        {isNewRegistration && (
          <Typography className={classes.helpText}>
            {intl.formatMessage({ id: 'loginNewRegistrationExplanation' })}
          </Typography>
        )}
        {allowCognitoLogin && ([
          <ListItem key="resetPassword" className={classNames({ [classes.hidden]: !allowResetPassword })}>
            <ValidatorForm className={classes.form} onSubmit={resetCognitoPassword}>
              <TextValidator
                className={classes.input}
                label={intl.formatMessage({ id: 'loginCode' })}
                name="code"
                validators={['required']}
                errorMessages={[intl.formatMessage({ id: 'loginCodeMissing' })]}
                fullWidth
                value={code}
                onChange={event => setCode(event.target.value)}
              />
              {getNewPasswordField()}
              {getConfirmPasswordField()}
              <Typography className={classes.errorText}>{error}</Typography>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
              >
                {intl.formatMessage({ id: 'loginResetCognitoPassword' })}
              </Button>
            </ValidatorForm>
          </ListItem>,
          <ListItem key="loginCognito" className={classNames({ [classes.hidden]: allowResetPassword })}>
            <ValidatorForm className={classes.form} onSubmit={loginCognito}>
              <TextValidator
                className={classes.input}
                label="Email"
                name="email"
                validators={['required', 'isEmail']}
                errorMessages={['Email is required', 'Email is not valid']}
                fullWidth
                value={email}
                onChange={event => setEmail(event.target.value)}
              />
              <TextValidator
                className={classes.input}
                label="Password"
                name="password"
                type="password"
                validators={['required']}
                errorMessages={['Password is required']}
                fullWidth
                value={password}
                onChange={event => setPassword(event.target.value)}
              />
              {isNewRegistration && getNewPasswordField()}
              {isNewRegistration && getConfirmPasswordField()}
              <Typography className={classes.errorText}>{error}</Typography>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={processing}
                fullWidth
              >
                {isNewRegistration? intl.formatMessage({ id: 'loginCompleteRegistrationButton' }) : intl.formatMessage({ id: 'loginLoginCognitoButton' })}
              </Button>
            </ValidatorForm>
          </ListItem>,
          !isNewRegistration && (<ListItem
            key="resetCognito"
            className={classNames(classes.noVertPadding, {
              [classes.hidden]: allowResetPassword,
            })}
          >
            <Button
              color="primary"
              onClick={forgotCognitoPassword}
              fullWidth
            >
              {intl.formatMessage({ id: 'loginForgotPassword' })}
            </Button>
          </ListItem>),
        ])}
        {(allowOidcLogin || allowUserLogin) && (
          <ListItem>
            <div className={classes.separator}/>
          </ListItem>
        )}
        {allowOidcLogin
        && (
          <ListItem>
            <Button
              variant="contained"
              color="primary"
              onClick={loginOidc}
              fullWidth
            >
              {intl.formatMessage({ id: 'login_admin' })}
            </Button>
          </ListItem>
        )}
        {allowUserLogin
        && (
          <ListItem>
            <Button
              variant="contained"
              color="primary"
              onClick={loginSso}
              fullWidth
            >
              {intl.formatMessage({ id: 'login_user' })}
            </Button>
          </ListItem>
        )}
        {allowGuestLogin
        && (
          <ListItem>
            <Button
              variant="contained"
              color="primary"
              onClick={loginAnonymous}
              fullWidth
            >
              {intl.formatMessage({ id: 'login_guest' })}
            </Button>
          </ListItem>
        )}
        {!isNewRegistration && !allowUserLogin && allowCognitoLogin && (
          <ListItem>
            <div className={classes.separator}/>
          </ListItem>
        )}
        {!isNewRegistration && !allowUserLogin && allowCognitoLogin && (
          <ListItem>
            <Button
              onClick={signup}
              variant="contained"
              color="primary"
              fullWidth
            >
              {intl.formatMessage({ id: 'loginSignupWithEmail' })}
            </Button>
          </ListItem>
        )}
      </List>
    </Dialog>
  );
}

LoginModal.propTypes = {
  dispatch: PropTypes.func.isRequired,
  intl: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  webSocket: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  usersReducer: PropTypes.object.isRequired,
};

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

function mapStateToProps(state) {
  return { ...state };
}

export default withBackgroundProcesses(withStyles(styles)(connect(mapStateToProps,
  mapDispatchToProps)(injectIntl(withRouter(React.memo(LoginModal))))));
