import React from 'react';
import PropTypes from 'prop-types';
import { Grid, Typography } from '@material-ui/core';
import _ from 'lodash';
import RaisedCard from '../../components/Cards/RaisedCard';

function ArchiveInvestbiles(props) {
  const { investibles } = props;

  const investibleData = investibles.map((inv) => inv.investible);
  const sortedData = _.sortBy(investibleData, 'updated_at', 'name').reverse();

  function getnvestibles() {
    return sortedData.map((investible) => {
      const { id, name, updated_at } = investible;
      return (
        <Grid
          key={id}
          item
          xs={3}
          />
        <RaisedCard

        >
          <Typography>{updated_at}</Typography>
          <Typography>{name}</Typography>
        </RaisedCard>
      )
    })
  }

  return (
    <Grid
      container
      spacing={2}
    >
      {getInvestibles()}
    </Grid>
  )
}

ArchiveInvestbiles.propTypes = {
  investibles: PropTypes.arrayOf(PropTypes.object),
};

ArchiveInvestbiles.defaultProps = {
  investibles: [],
};

export default ArchiveInvestbiles;
