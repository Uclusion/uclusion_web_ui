/* eslint-disable react/forbid-prop-types */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { ValidatorForm, TextValidator } from 'react-material-ui-form-validator';
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
import { formCurrentMarketLink } from '../../utils/marketIdPathFunctions';
import { withMarketId } from '../../components/PathProps/MarketId';
import { withBackgroundProcesses } from '../../components/BackgroundProcesses/BackgroundProcessWrapper';
import { setUclusionLocalStorageItem } from '../../components/utils';
import { loginOidc, loginSso, loginAnonymous, cognitoTokenGenerated, getErrorMessage,
} from '../../utils/loginFunctions';
import { getMarketLoginInfo } from '../../api/sso';
import withAppConfigs from '../../utils/withAppConfigs';

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
  const [loginInfoError, setLoginInfoError] = useState(false);
  const [helpMessage, setHelpMessage] = useState('');
  const {
    intl, classes, open, marketId, appConfig
  } = props;

  ValidatorForm.addValidationRule('isPasswordMatch', value => (value === newPassword));

  useEffect(() => {

    const { anonymousLogin, email } = loginParams;
    if (anonymousLogin) {
      loginAnonymous(props);
    }
    if (email) {
      setEmail(email);
    }
    getMarketLoginInfo(appConfig.api_configuration, marketId).then((response) => {
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
          setHelpMessage(intl.formatMessage({ id: 'loginNewRegistrationExplanation' }));
        }
      }
    }).catch((error) => {
      getErrorMessage(error)
        .then((errorString) => {
          setLoginInfoError(true);
          setError(errorString);
        });
    });
    return () => {
    };
  }, []);


  function changePasswordCognito(cognitoAuthorizer) {
    cognitoAuthorizer.completeNewPasswordChallenge(newPassword)
      .then((response) => {
        const uiPostAuthTasks = () => { setProcessing(false); };
        return cognitoTokenGenerated(props, response, cognitoAuthorizer, uiPostAuthTasks);
      })
      .catch((error) => {
        getErrorMessage(error)
          .then((message) => {
            setError(message);
          });
        console.error(error);
      });
  }

  function loginCognito() {
    setProcessing(true);
    const { marketId, uclusionUrl } = getLoginParams();
    const canonicalEmail = email.toLocaleLowerCase();
    const authorizerConfiguration = {
      username: canonicalEmail,
      password,
      poolId,
      clientId,
      marketId,
      baseURL: uclusionUrl,
    };
    cognitoAuthorizer = new CognitoAuthorizer(authorizerConfiguration);
    setError('');
    cognitoAuthorizer.authorize().then((response) => {
      console.debug(response);
      const uiPostAuthTasks = () => { setProcessing(false); };
      return cognitoTokenGenerated(props, response, cognitoAuthorizer, uiPostAuthTasks);
    }).catch((error) => {
      if ('newPasswordRequired' in error && error.newPasswordRequired) {
        if (newPassword) {
          changePasswordCognito(cognitoAuthorizer);
        } else {
          setIsNewRegistration(true);
          setProcessing(false);
          setHelpMessage(intl.formatMessage({ id: 'loginNewRegistrationExplanation' }));
          setNewPassword('');
          setConfirmPassword('');
        }
      } else {
        getErrorMessage(error)
          .then((errorString) => {
            setProcessing(false);
            setError(errorString);
          });
      }
    });
  }

  function forgotCognitoPassword() {
    const { marketId, uclusionUrl } = getLoginParams();
    const canonicalEmail = email.toLocaleLowerCase();
    const authorizerConfiguration = {
      username: canonicalEmail,
      poolId,
      clientId,
      marketId,
      baseURL: uclusionUrl,
    };
    cognitoAuthorizer = new CognitoAuthorizer(authorizerConfiguration);
    setError('');
    cognitoAuthorizer.forgotPassword().then(() => {
      setAllowResetPassword(true);
      setHelpMessage(intl.formatMessage({ id: 'check_email_code' }));
      setCode('');
      setNewPassword('');
      setConfirmPassword('');
    }).catch((error) => {
      getErrorMessage(error)
        .then((message) => {
          setError(message);
        });
      console.error(error);
    });
  }

  function resetCognitoPassword() {
    setError('');
    cognitoAuthorizer.confirmPassword(code, newPassword).then(() => {
      setHelpMessage(intl.formatMessage({ id: 'loginPasswordResetSuccess' }));
      setAllowResetPassword(false);
    }).catch((error) => {
      getErrorMessage(error)
        .then((message) => {
          setError(message);
        });
      console.error(error);
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
        <Typography className={classes.helpText}>
          {helpMessage}
        </Typography>
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
                {isNewRegistration ? intl.formatMessage({ id: 'loginCompleteRegistrationButton' }) : intl.formatMessage({ id: 'loginLoginCognitoButton' })}
              </Button>
            </ValidatorForm>
          </ListItem>,
          !isNewRegistration && (
            <ListItem
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
            </ListItem>
          ),
        ])}
        {(allowOidcLogin || allowUserLogin) && (
          <ListItem>
            <div className={classes.separator} />
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
              onClick={() => loginAnonymous(props)}
              fullWidth
            >
              {intl.formatMessage({ id: 'login_guest' })}
            </Button>
          </ListItem>
        )}
        {!isNewRegistration && !allowUserLogin && allowCognitoLogin && (
          <ListItem>
            <div className={classes.separator} />
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
      {loginInfoError && (
        <List>
          <ListItem>
            <Typography className={classes.errorText}>{error}</Typography>
          </ListItem>
        </List>
      )}
    </Dialog>
  );
}

LoginModal.propTypes = {
  // eslint-disable-next-line react/no-unused-prop-types
  dispatch: PropTypes.func.isRequired,
  intl: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  // eslint-disable-next-line react/no-unused-prop-types
  webSocket: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  // eslint-disable-next-line react/no-unused-prop-types
  usersReducer: PropTypes.object.isRequired,
};

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

function mapStateToProps(state) {
  return { ...state };
}

export default withBackgroundProcesses(withStyles(styles)(connect(mapStateToProps,
  mapDispatchToProps)(injectIntl(withRouter(React.memo(withMarketId(withAppConfigs(LoginModal))))))));
