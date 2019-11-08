import React, { useState } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Typography, Badge } from '@material-ui/core';
import {
  XYPlot,
  VerticalBarSeries,
  YAxis,
  Hint,
} from 'react-vis';

function Voting(props) {
  const [value, setValue] = useState(undefined);
  const { marketPresences, investibles } = props;
  const strippedInvestibles = investibles.map((inv) => inv.investible);

  function getVoteTotalsForUser(presence) {
    const { investments, name } = presence;
    const userInvestments = investments.reduce((uInv, investment) => {
      const { investible_id, quantity } = investment;
      return {
        ...uInv,
        [investible_id]: { x: name, y: quantity },
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

  function forgetValue() {
    setValue(undefined);
  }

  function getCertaintyChart(investments) {
    console.debug(investments);
    return (
      <XYPlot xType="ordinal" width={investments.length * 100} height={100} yDomain={[0, 100]}>
        <YAxis
          tickValues={[100]}
        />
        <VerticalBarSeries
          onValueMouseOver={setValue}
          onValueMouseOut={forgetValue}
          barWidth="0.65"
          data={investments}
        />
        {value ? <Hint value={value} /> : null}
      </XYPlot>
    );
  }

  function getItemVote(item) {
    const { id, investments, name } = item;
    return (
      <div key={id}>
        <Badge>
          {getCertaintyChart(investments)}
        </Badge>
        <Typography
          noWrap
        >
          {name}
        </Typography>
      </div>
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
  investibles: PropTypes.arrayOf(PropTypes.object),
  marketPresences: PropTypes.arrayOf(PropTypes.object),
};

Voting.defaultProps = {
  investibles: [],
  marketPresences: [],
};

export default Voting;
