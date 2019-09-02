import React, { Component } from 'react';
import { withA2HS } from 'a2hs';
import { ToastContainer } from 'react-toastify';
import App from '../App/App';
import config from '../../config';
import locales, { addLocalizationData } from '../../config/locales';
import 'react-toastify/dist/ReactToastify.css';
import Amplify, { Auth } from 'aws-amplify';
import awsconfig from '../../config/amplify';

import { AsyncMarketsProvider } from '../../contexts/AsyncMarketContext';
import { AsyncInvestiblesProvider } from '../../contexts/AsyncInvestiblesContext';
import { DrawerProvider } from '../../contexts/DrawerContext';
import { LocaleProvider } from '../../contexts/LocaleContext';

addLocalizationData(locales);
console.log(awsconfig);
Amplify.configure(awsconfig);
const oauth = {
  domain: 'uclusion-dev.auth.us-west-2.amazoncognito.com',
  scope: ['email', 'profile', 'openid', 'aws.cognito.signin.user.admin'],
  redirectSignIn: 'http://localhost:3000/',
  redirectSignOut: 'http://localhost:3000/',
  responseType: 'code' // or 'token', note that REFRESH token will only be generated when the responseType is code
};

Auth.configure({ oauth });

class Main extends Component {

  render() {
    return (
      <div>
        <AsyncInvestiblesProvider>
          <AsyncMarketsProvider>
            <DrawerProvider>
              <LocaleProvider>
                <ToastContainer/>
                <App appConfig={{ ...config }}/>
              </LocaleProvider>
            </DrawerProvider>
          </AsyncMarketsProvider>
        </AsyncInvestiblesProvider>
      </div>
    );
  }
}

export default withA2HS(Main);
