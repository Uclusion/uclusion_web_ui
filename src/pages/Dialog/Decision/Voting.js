import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Typography, Badge, Paper } from '@material-ui/core';
import EmojiPeopleIcon from '@material-ui/icons/EmojiPeople';
import MicroBarChart from 'react-micro-bar-chart';
import { useHistory } from 'react-router';
import { formInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';

function Voting(props) {

  const history = useHistory();

  const { marketPresences, investibles, marketId } = props;
  const strippedInvestibles = investibles.map((inv) => inv.investible);

  function getVoteTotalsForUser(presence) {
    const { investments } = presence;
    const userInvestments = investments.reduce((uInv, investment) => {
      const { investible_id, quantity } = investment;
      const oldValue = uInv[investible_id] || 0;
      const newValue = oldValue + quantity;
      return {
        ...uInv,
        [investible_id]: newValue,
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
            numSupporters: oldValue.numSupporters + 1,
            investments: [...oldValue.investments, userInvestments[investible_id]],
          };
          tallies[investible_id] = newValue;
        }
      });
    });
    return tallies;
  }

  function getCertaintyChart(investments) {
    return <MicroBarChart
      data={investments}
      height={10}
      width={20}
    />;
  }

  function getItemVote(item) {
    const { id, numSupporters, investments, name } = item;
    return (
      <Paper
        key={id}
        onClick={() => navigate(history, formInvestibleLink(marketId, id))}
      >
        <Badge
          showZero
          badgeContent={numSupporters}
        >
          <EmojiPeopleIcon/>
        </Badge>
        <Badge>
          {getCertaintyChart(investments)}
        </Badge>
        <Typography
          noWrap>
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
    <React.Fragment>
      {sortedTalliesArray.map((item) => getItemVote(item))}
    </React.Fragment>
  );
}

Voting.propTypes = {
  investibles: PropTypes.arrayOf(PropTypes.object),
  marketPresences: PropTypes.arrayOf(PropTypes.object),
  marketId: PropTypes.string.isRequired,
};

Voting.defaultProps = {
  investibles: [],
  marketPresences: [],
};

export default Voting;