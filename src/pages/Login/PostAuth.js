import React, { Component } from 'react';
import { constructAuthorizer } from 'uclusion_authorizer_sdk';
import Typography from '@material-ui/core/es/Typography/Typography';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { Redirect } from 'react-router';
import PropTypes from 'prop-types';
import appConfig from '../../config/config';
import { withBackgroundProcesses } from '../../components/BackgroundProcesses/BackgroundProcessWrapper';
import { postAuthTasks } from '../../utils/fetchFunctions';

class PostAuth extends Component {
  constructor(props) {
    super(props);
    this.state = { marketId: undefined, destination: undefined, failed: false };
    PostAuth.getPathAndQueryPart = PostAuth.getPathAndQueryPart.bind(this);
  }

  static getPathAndQueryPart(url) {
    const parsed = new URL(url);
    return parsed.pathname + parsed.search;
  }

  componentDidMount() {
    const pageUrl = window.location.href;
    const configuration = {
      pageUrl,
      uclusionUrl: appConfig.api_configuration.baseURL,
    };
    const { dispatch, webSocket } = this.props;
    const authorizer = constructAuthorizer(configuration);
    authorizer.authorize(pageUrl).then((resolve) => {
      // console.log(resolve)
      const {
        uclusion_token, destination_page, market_id, user,
      } = resolve;
      postAuthTasks(uclusion_token, authorizer.getType(), dispatch, market_id, user, webSocket);
      this.setState({ marketId: market_id, destination: destination_page, failed: false });
    }, (reject) => {
      this.setState({ failed: true });
    });
  }

  render() {
    const { intl, classes } = this.props;
    const { marketId, destination, failed } = this.state;

    if (marketId) {
      const path = PostAuth.getPathAndQueryPart(destination);
      return (
        <Redirect to={path} />
      );
    }

    if (failed) {
      return (
        <div>
          <Typography>
            {intl.formatMessage({ id: 'authorizationFailed' })}
          </Typography>
        </div>
      );
    }

    return <div />;
  }
}

function mapStateToProps(state) {
  return {};
}

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

PostAuth.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withBackgroundProcesses(connect(mapStateToProps, mapDispatchToProps)(injectIntl(PostAuth)));
