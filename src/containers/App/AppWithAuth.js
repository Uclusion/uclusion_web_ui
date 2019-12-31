import React, { useContext } from 'react';
import Amplify, { Auth } from 'aws-amplify';
import { Authenticator, SignIn, SignUp } from 'aws-amplify-react';
import config from '../../config';
import App from './App';
import awsconfig from '../../config/amplify';
import CustomSignIn from '../../authorization/CustomSignIn';
import UclusionSignup from '../../pages/Authentication/Signup';
import { LocaleContext } from '../../contexts/LocaleContext';
import { IntlProvider } from 'react-intl';
import { getLocaleMessages } from '../../config/locales';
import { makeStyles } from '@material-ui/styles';
import { useHistory } from 'react-router';
import VerifyEmail from '../../pages/Authentication/VerifyEmail';

Amplify.configure(awsconfig);
const oauth = {
  domain: config.cognito_domain,
  scope: ['email', 'profile', 'openid', 'aws.cognito.signin.user.admin'],
  redirectSignIn: config.ui_base_url,
  redirectSignOut: config.ui_base_url,
  responseType: 'code', // or 'token', note that REFRESH token will only be generated when the responseType is code
};


Auth.configure({ oauth });

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
      }
    },
  }
})

function AppWithAuth(props) {
  const [localeState] = useContext(LocaleContext);
  const { locale } = localeState;
  const classes = useStyles();
  const history = useHistory();
  const { location } = history;
  const { pathname } = location;
  console.log(location);
  const messages = {
    ...getLocaleMessages(locale),
  };
  // we have to bypass auth for the verifyEmailPage
  if (pathname === 'verifyEmail') {
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
        <Authenticator hide={[SignIn, SignUp]}>
          <UclusionSignup/>
          <CustomSignIn/>
          <App/>
        </Authenticator>
      </IntlProvider>
    </div>
  );
}


export default AppWithAuth;