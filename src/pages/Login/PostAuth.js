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
import { postAuthTasks } from '../../utils/postAuthFunctions';
import ReactWebAuthorizer from "../../utils/ReactWebAuthorizer";
import {setMarketAuth} from "../../components/utils";
import {getHashParams} from "uclusion_authorizer_sdk/src/utils";
import {getMarketId} from "../../utils/marketIdPathFunctions";


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
      const {
        uclusion_token, destination_page,
        market_id, user, deployed_version, uclusion_user_id,
      } = resolve;
      let realMarketId = market_id;
      console.debug(resolve);
      const uclusionTokenInfo = {
        token: uclusion_token,
        type: authorizerType,
      };
      if (uclusion_user_id) {
        uclusionTokenInfo.uclusion_user_id = uclusion_user_id;
      }
      postAuthTasks(props, deployed_version, uclusionTokenInfo, realMarketId, user);
      setPath(getPathAndQueryPart(destination_page));
    } else {
      const pageUrl = window.location.href;
      const configuration = {
        pageUrl,
        uclusionUrl: appConfig.api_configuration.baseURL,
      };
      // this code is crap, but the page only supports oidc and sso right now. We should really
      // just bundle in the response what the type is
      console.log(`pageUrl is ${pageUrl}`);
      const hashParams = getHashParams(pageUrl);
      const marketId = getMarketId();
      const authType = hashParams.has('id_token') ? 'oidc' : 'sso';
      setMarketAuth(marketId, { type: authType });
      const authorizer = new ReactWebAuthorizer(configuration);
      authorizer.authorize().then((resolve) => {
        console.log(resolve);
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
