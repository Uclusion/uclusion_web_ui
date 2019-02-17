import React, { PureComponent } from 'react';
import { withA2HS } from 'a2hs';
import { ToastContainer } from 'react-toastify';
import App from '../App/App';
import config from '../../config';
import configureStore from '../../store';
import locales, { addLocalizationData } from '../../config/locales';
import 'react-toastify/dist/ReactToastify.css';

addLocalizationData(locales);

class Main extends PureComponent {
  render() {
    return (
      <div>
        <ToastContainer />
        <App appConfig={{ configureStore, ...config }} />
      </div>
    );
  }
}

export default withA2HS(Main);
