import React, { useContext } from 'react'
import Amplify, { Auth } from 'aws-amplify'
import { Authenticator, ForgotPassword, Greetings, SignIn, SignOut, SignUp, } from 'aws-amplify-react'
import { IntlProvider } from 'react-intl'
import { makeStyles } from '@material-ui/styles'
import { useHistory } from 'react-router'
import config from '../../config/config'
import LogRocket from 'logrocket'
import App from './App'
import awsconfig from '../../config/amplify'
import CustomSignIn from '../../authorization/CustomSignIn'
import UclusionSignup from '../../pages/Authentication/Signup'
import { LocaleContext } from '../../contexts/LocaleContext'
import { getLocaleMessages } from '../../config/locales'
import VerifyEmail from '../../pages/Authentication/VerifyEmail'
import IntlGlobalProvider from '../../components/ContextHacks/IntlGlobalProvider'
import UclusionForgotPassword from '../../pages/Authentication/ForgotPassword'
import { registerListener } from '../../utils/MessageBusUtils'
import { AUTH_HUB_CHANNEL } from '../../contexts/WebSocketContext'
import TokenStorageManager from '../../authorization/TokenStorageManager'
import {
  clearUclusionLocalStorage,
  getUclusionLocalStorageItem,
  setUclusionLocalStorageItem
} from '../../components/utils'
import { redirectToPath } from '../../utils/redirectUtils'
import _ from 'lodash';

LogRocket.init(config.logRocketInstance)

Amplify.configure(awsconfig);

const useStyles = makeStyles({
  root: {
    '& .Nav__navBar___xtCFA': {
      position: 'absolute',
      top: '-42px',
      left: 0,
      right: 0,
      zIndex: '100',
      opacity: '0',
      transition: '0.3s ease-in-out',
      '&:hover': {
        transform: 'translate(0, 42px)',
        webkitTransform: 'translate(0, 42px)',
        mozTransform: 'translate(0, 42px)',
        oTransform: 'translate(0, 42px)',
        msTransform: 'translate(0, 42px)',
        opacity: '1',
      },
    },
  },
});

function AppWithAuth(props) {
  const [localeState] = useContext(LocaleContext);
  const { locale } = localeState;
  const classes = useStyles();
  const history = useHistory();
  const { location } = history;
  const { pathname, hash } = location;
  // console.debug(location);
  const messages = {
    ...getLocaleMessages(locale),
  };
  const LOGIN = '/';

  registerListener(AUTH_HUB_CHANNEL, 'signinSignoutLocalClearingHandler', (data) => {
    const { payload } = (data || {});
    const { event, data: payLoadData } = (payload || {});
    const { username } = (payLoadData || {});
    switch (event) {
      case 'signIn':
        const oldUserName = getUclusionLocalStorageItem('userName');
        if (oldUserName !== username) {
          clearUclusionLocalStorage();
          new TokenStorageManager().clearTokenStorage();
        }
        setUclusionLocalStorageItem('userName', username);
        break;
      case 'signOut':
        // First go to login so that url not exposed after logout
        redirectToPath(history, LOGIN);
        return new TokenStorageManager().clearTokenStorage()
          .then(clearUclusionLocalStorage);
      default:
        // ignore
    }
  });

  // we have to bypass auth for the verifyEmailPage
  if (pathname === '/verifyEmail') {
    return (
      <div className={classes.root}>
        <IntlProvider locale={locale} key={locale} messages={messages}>
          <VerifyEmail />
        </IntlProvider>
      </div>
    );
  }
  // Apparently you can't configure the Auth if you're not inside the authenticator
  // wrapper. So we'll do it here when we know we're not in verify email, which doesn't have
  // the wrapper (and doesn't use auth)
  const oauth = {
    domain: config.cognito_domain,
    scope: ['phone', 'email', 'profile', 'openid', 'aws.cognito.signin.user.admin'],
    redirectSignIn: config.ui_base_url,
    redirectSignOut: config.ui_base_url,
    responseType: 'code', // or 'token', note that REFRESH token will only be generated when the responseType is code
  };

  Auth.configure({ oauth });


  const authenticatorTheme = {
    toast: {
      position: 'static',
      backgroundColor: '#3f6b72',
    },
  };
  const authenticatorErrorMap = (message) => {
    if (/incorrect.*username.*password/i.test(message)) {
      return 'Incorrect Email or Password';
    }
    return message;
  };
  const authState = (!_.isEmpty(hash) && (hash.toUpperCase() === '#SIGNUP'))? 'signUp' : 'signIn';
  return (
    <div className={classes.root}>
      <IntlProvider locale={locale} key={locale} messages={messages}>
        <IntlGlobalProvider>
          <Authenticator
            errorMessage={authenticatorErrorMap}
            authState={authState}
            theme={authenticatorTheme}
            hide={[Greetings, SignIn, SignUp, SignOut, ForgotPassword]}>
            <UclusionSignup />
            <CustomSignIn />
            <UclusionForgotPassword />
            <App />
          </Authenticator>
        </IntlGlobalProvider>
      </IntlProvider>
    </div>
  );
}


export default AppWithAuth;
