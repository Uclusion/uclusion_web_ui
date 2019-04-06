/* eslint-disable react/forbid-prop-types */
import React, { useState, useEffect } from 'react';
import { constructAuthorizer } from 'uclusion_authorizer_sdk';
import Typography from '@material-ui/core/es/Typography/Typography';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { Redirect } from 'react-router';
import PropTypes from 'prop-types';
import appConfig from '../../config/config';
import { withBackgroundProcesses } from '../../components/BackgroundProcesses/BackgroundProcessWrapper';
import { postAuthTasks } from '../../utils/fetchFunctions';
import { clearReduxStore } from '../../utils/reduxHelperFunctions';

function PostAuth(props) {
  const [resolve, setResolve] = useState(undefined);
  const [failed, setFailed] = useState(undefined);
  const [authorizerType, setAuthorizerType] = useState(undefined);
  const [path, setPath] = useState(undefined);
  function getPathAndQueryPart(url) {
    const parsed = new URL(url);
    return parsed.pathname + parsed.search;
  }

  useEffect(() => {
    if (resolve) {
      // Have to do here or get warning about setting state before component mounted
      const { dispatch, webSocket } = props;
      const {
        uclusion_token, destination_page, market_id, user, usersReducer,
      } = resolve;
      // if we're not sure the user is the same as we loaded redux with, zero out redux
      if (!usersReducer || usersReducer.currentUser || usersReducer.currentUser.id !== user.id) {
        clearReduxStore();
      }
      const currentPage = new URL(destination_page);
      let realMarketId = market_id;
      if (currentPage.search.includes('authMarketId')) {
        realMarketId = currentPage.pathname.split('/')[1];
      }
      postAuthTasks(uclusion_token, authorizerType, dispatch, realMarketId, user, webSocket);
      setPath(getPathAndQueryPart(destination_page));
    } else {
      const pageUrl = window.location.href;
      const configuration = {
        pageUrl,
        uclusionUrl: appConfig.api_configuration.baseURL,
      };
      console.log(`pageUrl is ${pageUrl}`);
      const authorizer = constructAuthorizer(configuration);
      authorizer.authorize(pageUrl).then((resolve) => {
        setAuthorizerType(authorizer.getType());
        setFailed(false);
        setResolve(resolve);
      }, () => {
        setFailed(true);
      });
    }
    return () => {};
  }, [resolve]);

  const { intl } = props;
  return (
    <div>
      {path && (
      <Redirect to={path} />
      )}
      {failed && (
      <div>
        <Typography>
          {intl.formatMessage({ id: 'authorizationFailed' })}
        </Typography>
      </div>
      )}
    </div>
  );
}

function mapStateToProps(state) {
  return { ...state };
}

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

PostAuth.propTypes = {
  dispatch: PropTypes.func.isRequired,
  intl: PropTypes.object.isRequired,
  webSocket: PropTypes.object.isRequired,
};

export default withBackgroundProcesses(connect(mapStateToProps, mapDispatchToProps)(injectIntl(PostAuth)));
