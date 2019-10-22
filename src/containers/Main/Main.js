import React, { Component } from 'react';
import { withA2HS } from 'a2hs';
import { ToastContainer } from 'react-toastify';
import Amplify, { Auth } from 'aws-amplify';
import App from '../App/App';
import config from '../../config';
import 'react-toastify/dist/ReactToastify.css';
import awsconfig from '../../config/amplify';

import { MarketsProvider } from '../../contexts/MarketsContext/MarketsContext';
import { InvestiblesProvider } from '../../contexts/InvestibesContext/InvestiblesContext';
import { DrawerProvider } from '../../contexts/DrawerContext';
import { LocaleProvider } from '../../contexts/LocaleContext';
import { CommentsProvider } from '../../contexts/CommentsContext/CommentsContext';
import { NotificationsProvider } from '../../contexts/NotificationsContext';
import { AsyncMarketPresencesProvider } from '../../contexts/AsyncMarketPresencesContext';
import { AsyncMarketStagesProvider } from '../../contexts/AsyncMarketStagesContext';

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
    console.debug('Main being rerendered');
    return (
      <div>
        <NotificationsProvider>
          <MarketsProvider>
            <AsyncMarketStagesProvider>
              <CommentsProvider>
                <InvestiblesProvider>
                  <AsyncMarketPresencesProvider>
                    <DrawerProvider>
                      <LocaleProvider>
                        <ToastContainer />
                        <App appConfig={{ ...config }} />
                      </LocaleProvider>
                    </DrawerProvider>
                  </AsyncMarketPresencesProvider>>
                </InvestiblesProvider>
              </CommentsProvider>
            </AsyncMarketStagesProvider>
          </MarketsProvider>
        </NotificationsProvider>
      </div>
    );
  }
}

export default withA2HS(Main);
