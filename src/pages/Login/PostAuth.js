import React, { Component } from 'react';
import { constructAuthorizer } from 'uclusion_authorizer_sdk';
import Typography from '@material-ui/core/es/Typography/Typography';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { Redirect } from 'react-router';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import appConfig from '../../config/config';
import { withBackgroundProcesses } from '../../components/BackgroundProcesses/BackgroundProcessWrapper';
import { postAuthTasks } from '../../utils/fetchFunctions';

const styles = theme => ({
  container: {
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '80%',
    height: '80%',
  },
});

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
      const currentPage = new URL(destination_page);
      let realMarketId = market_id;
      if (currentPage.search.includes('authMarketId')) {
        realMarketId = currentPage.pathname.split('/')[1];
      }
      postAuthTasks(uclusion_token, authorizer.getType(), dispatch, realMarketId, user, webSocket);
      this.setState({ marketId: realMarketId, destination: destination_page, failed: false });
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

    return (
      <div className={classes.container}>
        <img className={classes.logo} src="/logo.svg" alt="logo" />
      </div>
    );
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

export default withBackgroundProcesses(withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(injectIntl(PostAuth))));
