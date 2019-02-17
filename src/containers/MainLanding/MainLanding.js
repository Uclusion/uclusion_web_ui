import React, { PureComponent } from 'react';
import { withA2HS } from 'a2hs';
import { ToastContainer } from 'react-toastify';
import App from '../App/App';
import config from '../../config';
import configureStore from '../../store';
import locales, { addLocalizationData } from '../../config/locales';
import 'react-toastify/dist/ReactToastify.css';

addLocalizationData(locales);

class MainLanding extends PureComponent {
  render() {
    return (
      <div>
        <ToastContainer />
        <App appConfig={{ configureStore, ...config }} isLanding />
      </div>
    );
  }
}

export default withA2HS(MainLanding);
