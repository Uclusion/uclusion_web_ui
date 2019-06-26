/* eslint-disable react/forbid-prop-types */
import React, { useState, useEffect } from 'react';

import Typography from '@material-ui/core/es/Typography/Typography';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { Redirect } from 'react-router';
import PropTypes from 'prop-types';
import appConfig from '../../config/config';
import { withBackgroundProcesses } from '../../components/BackgroundProcesses/BackgroundProcessWrapper';
import { postAuthTasks } from '../../utils/postAuthFunctions';
import ReactWebAuthorizer from '../../utils/ReactWebAuthorizer';
import {updateMarketAuth} from '../../components/utils';
import {getHashParams} from 'uclusion_authorizer_sdk/src/utils';
import {getMarketId} from '../../utils/marketIdPathFunctions';


function PostAuth(props) {
  const [resolve, setResolve] = useState(undefined);
  const [failed, setFailed] = useState(undefined);
  const [path, setPath] = useState(undefined);
  function getPathAndQueryPart(url) {
    const parsed = new URL(url);
    return parsed.pathname + parsed.search;
  }

  useEffect(() => {
    if (resolve) {
      // Have to do here or get warning about setting state before component mounted
      const { destination_page } = resolve;
      postAuthTasks(props, resolve)
        .then(() => {
          setPath(getPathAndQueryPart(destination_page));
        });
    } else {
      // this code is crap, but the page only supports oidc and sso right now. We should really
      // just bundle in the response what the type is
      const pageUrl = window.location.href;
      console.log(`pageUrl is ${pageUrl}`);
      const hashParams = getHashParams(pageUrl);
      const marketId = getMarketId();
      const authType = hashParams.has('id_token') ? 'oidc' : 'sso';
      updateMarketAuth(marketId, { type: authType, config: appConfig.api_configuration });
      const authorizer = new ReactWebAuthorizer(appConfig.api_configuration);
      authorizer.authorize().then((resolve) => {
        setFailed(false);
        setResolve(resolve);
      }, () => {
        setFailed(true);
      });
    }
    return () => {};
  }, [resolve, props]);

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
