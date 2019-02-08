import React, { Component } from 'react';
import { Helmet } from 'react-helmet';
import { withA2HS } from 'a2hs';
import { ToastContainer } from 'react-toastify';
import App from '../App/App';
import config from '../../config';
import configureStore from '../../store';
import locales, { addLocalizationData } from '../../config/locales';
import 'react-toastify/dist/ReactToastify.css';

addLocalizationData(locales);

class Main extends Component {
  componentDidMount() {
    // const { setA2HPState } = this.props
    // console.log(this.props)
    // setA2HPState({ isAppInstallable: true })
  }

  render() {
    return (
      <div>
        <Helmet>
          <link async rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
          <link async rel="stylesheet" href="index.css" />
        </Helmet>
        <ToastContainer />
        <App appConfig={{ configureStore, ...config }} />
      </div>
    );
  }
}

export default withA2HS(Main);
