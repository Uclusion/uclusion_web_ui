import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';
import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';
import am4themes_animated from '@amcharts/amcharts4/themes/animated';
import Activity from '../../containers/Activity/Activity';
import { withUserAndPermissions } from '../../components/UserPermissions/UserPermissions';
import { getClient } from '../../config/uclusionClient';
import { ERROR, sendIntlMessage } from '../../utils/userMessage';
import withAppConfigs from '../../utils/withAppConfigs';
import { withMarketId } from '../../components/PathProps/MarketId';

am4core.useTheme(am4themes_animated);

const styles = theme => ({
  root: {
    padding: theme.spacing.unit * 2,
    height: '100%',
    overflow: 'auto',
    boxSizing: 'border-box',
  },
  chart: {
    width: '100%',
    height: '500px',
  },
});

function Dashboard(props) {
  const [summaries, setSummaries] = useState(undefined);
  const {
    marketId,
    classes,
    intl,
  } = props;
  let usersChart = null;
  let totalSharesChart = null;

  function setupChart(data, dom) {
    const chart = am4core.create(dom, am4charts.XYChart);

    chart.paddingRight = 20;
    chart.data = data;

    const dateAxis = chart.xAxes.push(new am4charts.DateAxis());
    dateAxis.renderer.grid.template.location = 0;

    const valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
    valueAxis.tooltip.disabled = true;
    valueAxis.renderer.minWidth = 35;

    const series = chart.series.push(new am4charts.ColumnSeries());
    series.dataFields.dateX = 'date';
    series.dataFields.valueY = 'value';

    series.tooltipText = '{valueY.value}';
    chart.cursor = new am4charts.XYCursor();

    const scrollbarX = new am4charts.XYChartScrollbar();
    scrollbarX.series.push(series);
    chart.scrollbarX = scrollbarX;

    return chart;
  }

  useEffect(() => {
    const clientPromise = getClient();
    clientPromise
      .then(client => client.summaries.marketSummary(marketId))
      .then((data) => {
        setSummaries(data.summaries);
        const usersChartData = data.summaries.map(({ date, num_users }) => ({
          date,
          value: num_users,
        }));
        const totalSharesChartData = data.summaries.map(({ date, total_shares }) => ({
          date,
          value: total_shares,
        }));
        usersChart = setupChart(usersChartData, 'users-chart');
        totalSharesChart = setupChart(totalSharesChartData, 'total-shares-chart');
      })
      .catch((error) => {
        console.log(error);
        sendIntlMessage(ERROR, { id: 'summariesLoadFailed' });
      });

    return () => {
      if (usersChart) {
        usersChart.dispose();
      }
      if (totalSharesChart) {
        usersChart.dispose();
      }
    };
  }, [marketId]);

  return (
    <div>
      <Activity
        isLoading={summaries === undefined}
        title={intl.formatMessage({ id: 'dashboardMenu' })}
      >
        <div className={classes.root}>
          <div className={classes.chart} id="users-chart" />
          <div className={classes.chart} id="total-shares-chart" />
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
