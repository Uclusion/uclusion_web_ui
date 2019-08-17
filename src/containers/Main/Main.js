import React, { Component } from 'react';
import { withA2HS } from 'a2hs';
import { ToastContainer } from 'react-toastify';
import App from '../App/App';
import config from '../../config';
import locales, { addLocalizationData } from '../../config/locales';
import 'react-toastify/dist/ReactToastify.css';
import Amplify from 'aws-amplify';
import awsconfig from '../../config/amplify';

import { MarketsProvider } from '../../contexts/MarketsContext';
import { InvestiblesProvider } from '../../contexts/InvestiblesContext';
import { DrawerProvider } from '../../contexts/DrawerContext';
import { LocaleProvider } from '../../contexts/LocaleContext';

addLocalizationData(locales);
console.log(awsconfig);
Amplify.configure(awsconfig);

class Main extends Component {

  render() {
    return (
      <div>
        <InvestiblesProvider>
          <MarketsProvider>
            <DrawerProvider>
              <LocaleProvider>
                <ToastContainer/>
                <App appConfig={{ ...config }}/>
              </LocaleProvider>
            </DrawerProvider>
          </MarketsProvider>
        </InvestiblesProvider>
      </div>
    );
  }
}

export default withA2HS(Main);
