import React, { useContext } from 'react'
import Amplify, { Auth } from 'aws-amplify'
import { Authenticator, ForgotPassword, Greetings, SignIn, SignOut, SignUp, } from 'aws-amplify-react'
import { IntlProvider } from 'react-intl'
import { makeStyles } from '@material-ui/styles'
import { useHistory } from 'react-router'
import config from '../../config/config'
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
} from '../../components/localStorageUtils'
import _ from 'lodash'
import { decomposeMarketPath } from '../../utils/marketIdPathFunctions'
import queryString from 'query-string'
import { getAndClearEmail } from '../../utils/redirectUtils'

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

function AppWithAuth() {
  const [localeState] = useContext(LocaleContext);
  const { locale } = localeState;
  const classes = useStyles();
  const history = useHistory();
  const { location } = history;
  const { pathname, hash, search } = location;
  const { marketId: marketToken, action, investibleId: code } = decomposeMarketPath(pathname);
  const messages = {
    ...getLocaleMessages(locale),
  };

  registerListener(AUTH_HUB_CHANNEL, 'signinSignoutLocalClearingHandler', (data) => {
    const { payload } = (data || {});
    const { event, data: payLoadData } = (payload || {});
    const { username } = (payLoadData || {});
    switch (event) {
      case 'signIn':
        const oldUserName = getUclusionLocalStorageItem('userName');
        if (oldUserName && oldUserName !== username) {
          console.info(`Clearing storage for ${username} and ${oldUserName}`);
          // Only clear if there was a userName there otherwise window refresh during signup
          new TokenStorageManager().clearTokenStorage().then(() => clearUclusionLocalStorage(true));
        }
        setUclusionLocalStorageItem('userName', username);
        break;
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
      maxWidth: '400px',
      marginLeft: 'auto',
      position: 'relative',
      marginRight: 'auto',
      textAlign: 'center',
      top: '10px',
      fontSize: '1rem',
      minHeight: '45px',
      padding: '8px',
      lineHeight: '37px',
      marginBottom: '-53px',
      color: 'white',
      background: '#e85756',
      borderRadius: '8px'
    }
  };
  const authenticatorErrorMap = (message) => {
    if (/incorrect.*username.*password/i.test(message)) {
      return 'Incorrect Email or Password';
    }
    return message;
  };
  const isInvite = action === 'invite';
  const email = queryString.parse(search || '');
  const authState = (!_.isEmpty(hash) && (hash.toUpperCase() === '#SIGNUP'))||isInvite || email.email ? 'signUp' : 'signIn';
  return (
    <div className={classes.root}>
      <IntlProvider locale={locale} key={locale} messages={messages}>
        <IntlGlobalProvider>
          <Authenticator
            errorMessage={authenticatorErrorMap}
            authState={authState}
            theme={authenticatorTheme}
            hide={[Greetings, SignIn, SignUp, SignOut, ForgotPassword]}>
            <UclusionSignup marketToken={isInvite ? marketToken : undefined} code={code} />
            <CustomSignIn defaultEmail={getAndClearEmail()}/>
            <UclusionForgotPassword />
            <App />
          </Authenticator>
        </IntlGlobalProvider>
      </IntlProvider>
    </div>
  );
}


export default AppWithAuth;
