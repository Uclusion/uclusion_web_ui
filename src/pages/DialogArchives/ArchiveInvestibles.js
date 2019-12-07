import React from 'react';
import PropTypes from 'prop-types';
import { Grid, Typography } from '@material-ui/core';
import _ from 'lodash';
import RaisedCard from '../../components/Cards/RaisedCard';
import { useIntl } from 'react-intl';
import { formInvestibleLink, navigate } from '../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';

function ArchiveInvestbiles(props) {
  const { investibles, marketId } = props;
  const intl = useIntl();
  const history = useHistory();
  const investibleData = investibles.map((inv) => inv.investible);
  const sortedData = _.sortBy(investibleData, 'updated_at', 'name').reverse();

  function getInvestibleOnClick(id) {
    return () => {
      const link = formInvestibleLink(marketId, id);
      navigate(history, link);
    };
  }

  function getInvestibles() {
    return sortedData.map((investible) => {
      const { id, name, updated_at } = investible;
      return (
        <Grid
          key={id}
          item
          xs={3}
        >
          <RaisedCard
            onClick={getInvestibleOnClick(id)}
          >
            <Typography>{intl.formatDate(updated_at)}</Typography>
            <Typography>{name}</Typography>
          </RaisedCard>
        </Grid>
      );
    });
  }

  return (
    <Grid
      container
      spacing={2}
    >
      {getInvestibles()}
    </Grid>
  );
}

ArchiveInvestbiles.propTypes = {
  investibles: PropTypes.arrayOf(PropTypes.object),
  marketId: PropTypes.string.isRequired,
};

ArchiveInvestbiles.defaultProps = {
  investibles: [],
};

export default ArchiveInvestbiles;
