import React, { useContext } from 'react';
import Amplify from 'aws-amplify';
import {
  Authenticator, SignIn, SignUp, ForgotPassword, SignOut, Greetings,
} from 'aws-amplify-react';
import { IntlProvider } from 'react-intl';
import { makeStyles } from '@material-ui/styles';
import { useHistory } from 'react-router';
import config from '../../config/config';
import LogRocket from 'logrocket';
import App from './App';
import awsconfig from '../../config/amplify';
import CustomSignIn from '../../authorization/CustomSignIn';
import UclusionSignup from '../../pages/Authentication/Signup';
import { LocaleContext } from '../../contexts/LocaleContext';
import { getLocaleMessages } from '../../config/locales';
import VerifyEmail from '../../pages/Authentication/VerifyEmail';
import IntlGlobalProvider from '../../components/ContextHacks/IntlGlobalProvider';
import UclusionForgotPassword from '../../pages/Authentication/ForgotPassword';
import { registerListener } from '../../utils/MessageBusUtils';
import { AUTH_HUB_CHANNEL } from '../../contexts/WebSocketContext';
import TokenStorageManager from '../../authorization/TokenStorageManager';


LogRocket.init(config.logRocketInstance)

Amplify.configure(awsconfig);
/*
const oauth = {
  domain: config.cognito_domain,
  scope: ['email', 'profile', 'openid', 'aws.cognito.signin.user.admin'],
  redirectSignIn: config.ui_base_url,
  redirectSignOut: config.ui_base_url,
  responseType: 'code', // or 'token', note that REFRESH token will only be generated when the responseType is code
};


Auth.configure({ oauth });
*/
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
  const { pathname } = location;
  console.debug(location);
  const messages = {
    ...getLocaleMessages(locale),
  };

  registerListener(AUTH_HUB_CHANNEL, 'signinSignoutLocalClearingHandler', (data) => {
    const { payload: { event } } = data;
    switch (event) {
      case 'signIn':
      case 'signOut':
        new TokenStorageManager().clearTokenStorage();
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

  return (
    <div className={classes.root}>
      <IntlProvider locale={locale} key={locale} messages={messages}>
        <IntlGlobalProvider>
          <Authenticator hide={[Greetings, SignIn, SignUp, SignOut, ForgotPassword]}>
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
