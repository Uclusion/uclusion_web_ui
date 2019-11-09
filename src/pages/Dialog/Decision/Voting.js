import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Typography, Paper } from '@material-ui/core';
import {
  XYPlot,
  VerticalBarSeries, Borders,
} from 'react-vis';
import { useHistory } from 'react-router';
import { formInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';

function Voting(props) {
  const history = useHistory();

  const { marketPresences, investibles, marketId } = props;
  const strippedInvestibles = investibles.map((inv) => inv.investible);

  function getVoteTotalsForUser(presence) {
    const { investments, name } = presence;
    const userInvestments = investments.reduce((uInv, investment) => {
      const { investible_id, quantity } = investment;
      return {
        ...uInv,
        [investible_id]: { x: name, y: quantity, color: quantity / 20 },
      };
    }, {});
    return userInvestments;
  }

  function getInvestibleVotes() {
    // first set every investibles support and investments to 0
    const tallies = strippedInvestibles.reduce((acc, inv) => {
      const { id } = inv;
      const augmented = {
        ...inv,
        numSupporters: 0,
        investments: [],
      };
      acc[id] = augmented;
      return acc;
    }, {});
    // now we fill in votes from market presences
    marketPresences.forEach((presence) => {
      const userInvestments = getVoteTotalsForUser(presence);
      Object.keys(userInvestments).forEach((investible_id) => {
        const oldValue = tallies[investible_id];
        if (oldValue) {
          const newValue = {
            ...oldValue,
            investments: [...oldValue.investments, userInvestments[investible_id]],
          };
          tallies[investible_id] = newValue;
        }
      });
    });
    return tallies;
  }

  const margin = {
    top: 0,
    bottom: 1,
    left: 0,
    right: 1,
  };

  function getCertaintyChart(investments) {
    return (
      <XYPlot
        xType="ordinal"
        width={investments.length * 60}
        height={100}
        yDomain={[0, 100]}
        colorDomain={[0, 5]}
        colorRange={['red', 'orange', 'yellow', 'green']}
        margin={margin}
      >
        <Borders style={{
          bottom: { fill: '#16191f', height: 1 },
          left: { fill: '#16191f', width: 1 },
          right: { fill: '#16191f', width: 1 },
          top: { fill: '#16191f', height: 1 },
        }}
        />
        <VerticalBarSeries
          barWidth="0.4"
          data={investments}
        />
      </XYPlot>
    );
  }

  function getItemVote(item) {
    const { id, investments, name } = item;
    return (
      <Paper
        key={id}
        onClick={() => navigate(history, formInvestibleLink(marketId, id))}
      >
        {getCertaintyChart(investments)}
        <Typography
          noWrap
        >
          {name}
        </Typography>
      </Paper>
    );
  }


  const tallies = getInvestibleVotes();
  console.log(tallies);
  const talliesArray = Object.values(tallies);
  // descending order of support
  const sortedTalliesArray = _.sortBy(talliesArray, 'numSupporters', 'name').reverse();


  return (
    <>
      {sortedTalliesArray.map((item) => getItemVote(item))}
    </>
  );
}

Voting.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  investibles: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
  marketPresences: PropTypes.arrayOf(PropTypes.object),
  marketId: PropTypes.string.isRequired,
};

Voting.defaultProps = {
  investibles: [],
  marketPresences: [],
};

export default Voting;
