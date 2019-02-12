import React, { Component } from 'react';
import { OidcAuthorizer, SsoAuthorizer, AnonymousAuthorizer } from 'uclusion_authorizer_sdk';
import {
  Button, Dialog, DialogTitle, List, ListItem,
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';
import appConfig from '../../config/config';
import { getAuthMarketId, getMarketId } from '../../utils/marketIdPathFunctions';
import { postAuthTasks } from '../../utils/fetchFunctions';
import { connect } from 'react-redux';
import { withBackgroundProcesses } from '../../components/BackgroundProcesses/BackgroundProcessWrapper';

const styles = theme => ({
  button: {
    width: 240,
  },
});

class LoginModal extends Component {
  getDestinationPage(subPath) {
    const marketId = getMarketId();
    const newPath = `/${marketId}/${subPath}`;
    const currentPage = new URL(window.location.href);
    currentPage.pathname = newPath;
    currentPage.search = '';
    return currentPage.toString();
  }

  getLoginParams() {
    const marketId = getAuthMarketId();
    const parsed = new URL(window.location.href);
    let page = 'investibles';
    if (parsed.search.includes('destinationPage')) {
      page = parsed.search.split('=')[1];
    }
    const destinationPage = this.getDestinationPage(page);
    const redirectUrl = this.getDestinationPage('post_auth');
    const pageUrl = window.location.href;
    const uclusionUrl = appConfig.api_configuration.baseURL;
    return {
      marketId,
      destinationPage,
      redirectUrl,
      pageUrl,
      uclusionUrl,
    };
  }

  doLoginRedirect(authorizer, loginParams) {
    const { pageUrl, destinationPage, redirectUrl } = loginParams;
    const redirectPromise = authorizer.authorize(pageUrl, destinationPage, redirectUrl);
    redirectPromise.then((location) => {
      console.log(location);
      window.location = location;
    });
  }

  loginOidc = () => {
    const loginParams = this.getLoginParams();
    const authorizer = new OidcAuthorizer(loginParams);
    this.doLoginRedirect(authorizer, loginParams);
  };

  loginSso = () => {
    const loginParams = this.getLoginParams();
    const authorizer = new SsoAuthorizer(loginParams);
    this.doLoginRedirect(authorizer, loginParams);
  };

  loginAnonymous = () => {
    const { dispatch, webSocket } = this.props;
    const loginParams = this.getLoginParams();
    const authorizer = new AnonymousAuthorizer(loginParams);
    authorizer.doPostAuthorize().then((resolve) => {
      const {
        uclusion_token, market_id, user,
      } = resolve;
      postAuthTasks(uclusion_token, authorizer.getType(), dispatch, market_id, user, webSocket);
    });
  };

  render() {
    const { intl, classes, ...other } = this.props;

    return (
      <Dialog onClose={() => null} aria-labelledby="simple-dialog-title" {...other}>
        <DialogTitle id="simple-dialog-title">Log In</DialogTitle>
        <div>
          <List>
            <ListItem>
              <Button
                className={classes.button}
                variant="contained"
                color="primary"
                onClick={this.loginOidc}
              >
                {intl.formatMessage({ id: 'login_admin' })}
              </Button>
            </ListItem>
            <ListItem>
              <Button
                className={classes.button}
                variant="contained"
                color="primary"
                onClick={this.loginSso}
              >
                {intl.formatMessage({ id: 'login_user' })}
              </Button>
            </ListItem>
            <ListItem>
              <Button
                className={classes.button}
                variant="contained"
                color="primary"
                onClick={this.loginAnonymous}
              >
                {intl.formatMessage({ id: 'login_guest' })}
              </Button>
            </ListItem>
          </List>
        </div>
      </Dialog>
    );
  }
}

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

function mapStateToProps(state) {
  return { ...state };
}

export default withBackgroundProcesses(withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(injectIntl(LoginModal))));
