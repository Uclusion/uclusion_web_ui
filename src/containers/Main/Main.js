import React, { Component } from 'react';
import { withA2HS } from 'a2hs';
import { ToastContainer } from 'react-toastify';
import Amplify, { Auth } from 'aws-amplify';
import App from '../App/App';
import config from '../../config';
import 'react-toastify/dist/ReactToastify.css';
import awsconfig from '../../config/amplify';

import { AsyncMarketsProvider } from '../../contexts/AsyncMarketContext';
import { AsyncInvestiblesProvider } from '../../contexts/AsyncInvestiblesContext';
import { DrawerProvider } from '../../contexts/DrawerContext';
import { LocaleProvider } from '../../contexts/LocaleContext';
import { AsyncCommentsProvider } from '../../contexts/AsyncCommentsContext';
import { NotificationsProvider } from '../../contexts/NotificationsContext';
import { AsyncMarketPresencesProvider } from '../../contexts/AsyncMarketPresencesContext';
import { AsyncMarketStagesProvider } from '../../contexts/AsyncMarketStagesContext';
import { VisitProvider } from '../../contexts/VisitContext';

console.log(awsconfig);
Amplify.configure(awsconfig);
const oauth = {
  domain: 'uclusion-dev.auth.us-west-2.amazoncognito.com',
  scope: ['email', 'profile', 'openid', 'aws.cognito.signin.user.admin'],
  redirectSignIn: 'http://localhost:3000/',
  redirectSignOut: 'http://localhost:3000/',
  responseType: 'code', // or 'token', note that REFRESH token will only be generated when the responseType is code
};

Auth.configure({ oauth });

class Main extends Component {

  render() {
    return (
      <div>
        <NotificationsProvider>
          <AsyncMarketPresencesProvider>
            <AsyncMarketStagesProvider>
              <AsyncCommentsProvider>
                <AsyncInvestiblesProvider>
                  <AsyncMarketsProvider>
                    <DrawerProvider>
                      <LocaleProvider>
                        <VisitProvider>
                          <ToastContainer />
                          <App appConfig={{ ...config }} />
                        </VisitProvider>
                      </LocaleProvider>
                    </DrawerProvider>
                  </AsyncMarketsProvider>
                </AsyncInvestiblesProvider>
              </AsyncCommentsProvider>
            </AsyncMarketStagesProvider>
          </AsyncMarketPresencesProvider>
        </NotificationsProvider>
      </div>
    );
  }
}

export default withA2HS(Main);
