import React from 'react';
import Amplify, { Auth } from 'aws-amplify';
import { Authenticator, SignIn } from 'aws-amplify-react';
import config from '../../config';
import App from './App';
import awsconfig from '../../config/amplify';
import CustomSignIn from '../../authorization/CustomSignIn';

Amplify.configure(awsconfig);
const oauth = {
  domain: config.cognito_domain,
  scope: ['email', 'profile', 'openid', 'aws.cognito.signin.user.admin'],
  redirectSignIn: config.ui_base_url,
  redirectSignOut: config.ui_base_url,
  responseType: 'code', // or 'token', note that REFRESH token will only be generated when the responseType is code
};

Auth.configure({ oauth });

class AppWithAuth extends React.Component {
  render() {
    return (
      <div>
        <Authenticator hide={[SignIn]}>
          <CustomSignIn />
          <App />
        </Authenticator>
      </div>
    );
  }
}

export default AppWithAuth;