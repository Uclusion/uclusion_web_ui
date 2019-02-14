/* eslint-disable react/forbid-prop-types */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { OidcAuthorizer, SsoAuthorizer, AnonymousAuthorizer } from 'uclusion_authorizer_sdk';
import {
  Button, Dialog, DialogTitle, List, ListItem,
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import appConfig from '../../config/config';
import { getAuthMarketId, formCurrentMarketLink, getMarketId } from '../../utils/marketIdPathFunctions';
import { postAuthTasks } from '../../utils/fetchFunctions';
import { withBackgroundProcesses } from '../../components/BackgroundProcesses/BackgroundProcessWrapper';

const styles = theme => ({
  button: {
    width: 240,
  },
});

function LoginModal(props) {
  const [allowGuestLogin, setAllowGuestLogin] = useState(false);
  function getDestinationPage(subPath, includeAuthMarket) {
    const currentPage = new URL(window.location.href);
    let authMarketId;
    if (currentPage.search.includes('authMarketId')) {
      const parsed = currentPage.search.substr(currentPage.search.indexOf('authMarketId'));
      authMarketId = parsed.split('=')[1];
    }
    const marketId = includeAuthMarket || !authMarketId ? getMarketId() : authMarketId;
    currentPage.pathname = `/${marketId}/${subPath}`;
    currentPage.search = authMarketId && includeAuthMarket ? `authMarketId=${authMarketId}` : '';
    return currentPage.toString();
  }
  function getLoginParams() {
    const marketId = getAuthMarketId();
    const parsed = new URL(window.location.href);
    let page = 'investibles';
    if (parsed.search.includes('destinationPage')) {
      page = parsed.search.split('=')[1];
      if (page.includes('&')) {
        page = page.split('&')[0];
      }
    }
    const destinationPage = getDestinationPage(page, true);
    const redirectUrl = getDestinationPage('post_auth', false);
    const pageUrl = window.location.href;
    const uclusionUrl = appConfig.api_configuration.baseURL;
    console.log(`page = ${page}`);
    console.log(`destinationPage = ${destinationPage}`);
    console.log(`redirectUrl = ${redirectUrl}`);
    return {
      marketId,
      destinationPage,
      redirectUrl,
      pageUrl,
      uclusionUrl,
    };
  }
  useEffect(() => {
    const loginParams = getLoginParams();
    const authorizer = new AnonymousAuthorizer(loginParams);
    authorizer.marketLoginInfo().then((response) => {
      const allowAnonymous = response.allow_anonymous;
      setAllowGuestLogin(allowAnonymous);
    });
    return () => {};
  });
  function doLoginRedirect(authorizer, loginParams) {
    const { pageUrl, destinationPage, redirectUrl } = loginParams;
    const redirectPromise = authorizer.authorize(pageUrl, destinationPage, redirectUrl);
    redirectPromise.then((location) => {
      console.log(location);
      window.location = location;
    });
  }

  function loginOidc() {
    const loginParams = getLoginParams();
    const authorizer = new OidcAuthorizer(loginParams);
    doLoginRedirect(authorizer, loginParams);
  }

  function loginSso() {
    const loginParams = getLoginParams();
    const authorizer = new SsoAuthorizer(loginParams);
    doLoginRedirect(authorizer, loginParams);
  }

  function loginAnonymous() {
    const { dispatch, webSocket, history } = props;
    const loginParams = getLoginParams();
    const authorizer = new AnonymousAuthorizer(loginParams);
    authorizer.doPostAuthorize().then((resolve) => {
      const {
        uclusion_token, market_id, user,
      } = resolve;
      postAuthTasks(uclusion_token, authorizer.getType(), dispatch, market_id, user, webSocket);
      history.push(formCurrentMarketLink('investibles'));
    });
  }

  const { intl, classes, ...other } = props;
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
              onClick={loginOidc}
            >
              {intl.formatMessage({ id: 'login_admin' })}
            </Button>
          </ListItem>
          <ListItem>
            <Button
              className={classes.button}
              variant="contained"
              color="primary"
              onClick={loginSso}
            >
              {intl.formatMessage({ id: 'login_user' })}
            </Button>
          </ListItem>
          {allowGuestLogin
          && (
            <ListItem>
              <Button
                className={classes.button}
                variant="contained"
                color="primary"
                onClick={loginAnonymous}
              >
                {intl.formatMessage({ id: 'login_guest' })}
              </Button>
            </ListItem>
          )}
        </List>
      </div>
    </Dialog>
  );
}

LoginModal.propTypes = {
  dispatch: PropTypes.func.isRequired,
  intl: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  webSocket: PropTypes.object.isRequired,
};

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

function mapStateToProps(state) {
  return { ...state };
}

export default withBackgroundProcesses(withStyles(styles)(connect(mapStateToProps,
  mapDispatchToProps)(injectIntl(withRouter(LoginModal)))));
