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

Amplify.configure(awsconfig);
const oauth = {
  domain: config.cognito_domain,
  scope: ['email', 'profile', 'openid', 'aws.cognito.signin.user.admin'],
  redirectSignIn: config.ui_base_url,
  redirectSignOut: config.ui_base_url,
  responseType: 'code', // or 'token', note that REFRESH token will only be generated when the responseType is code
};


Auth.configure({ oauth });

function AppWithAuth(props) {
  const [localeState] = useContext(LocaleContext);
  const { locale } = localeState;
  const messages = {
    ...getLocaleMessages(locale),
  };

  return (
    <div>
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