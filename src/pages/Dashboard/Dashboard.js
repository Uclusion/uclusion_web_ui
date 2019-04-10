import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';
import Activity from '../../containers/Activity/Activity';
import { withUserAndPermissions } from '../../components/UserPermissions/UserPermissions';
import { getClient } from '../../config/uclusionClient';
import { ERROR, sendIntlMessage } from '../../utils/userMessage';
import withAppConfigs from '../../utils/withAppConfigs';
import { withMarketId } from '../../components/PathProps/MarketId';

const styles = theme => ({
  root: {
    padding: theme.spacing.unit * 2,
  },
});

function Dashboard(props) {
  const [summaries, setSummaries] = useState(undefined);
  const {
    marketId,
    classes,
    intl,
  } = props;

  useEffect(() => {
    const clientPromise = getClient();
    clientPromise
      .then(client => client.summaries.marketSummary(marketId))
      .then((data) => {
        setSummaries(data);
        console.log('####', data);
      })
      .catch((error) => {
        console.log(error);
        sendIntlMessage(ERROR, { id: 'summariesLoadFailed' });
      });
  }, [marketId]);

  return (
    <div>
      <Activity
        isLoading={summaries === undefined}
        title={intl.formatMessage({ id: 'dashboardHeader' })}
        hideMarketSelect
      >
        <div className={classes.root}>
          Dashboard
        </div>
      </Activity>
    </div>
  );
}

Dashboard.propTypes = {
  marketId: PropTypes.string.isRequired,
  classes: PropTypes.object.isRequired, //eslint-disable-line
  intl: PropTypes.object.isRequired, //eslint-disable-line
};

function mapStateToProps() {
  return {};
}

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

export default connect(mapStateToProps, mapDispatchToProps)(
  injectIntl(withUserAndPermissions(withAppConfigs(withMarketId(withStyles(styles)(Dashboard))))),
);
