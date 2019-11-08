import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Typography, Badge } from '@material-ui/core';
import EmojiPeopleIcon from '@material-ui/icons/EmojiPeople';
import MicroBarChart from 'react-micro-bar-chart';
function Voting(props) {

  const { marketPresences, investibles } = props;
  const noVotesMessage = "No active votes";

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

  function computeVoteTallies() {
    return marketPresences.reduce((acc, presence) => {
      const userInvestments = getVoteTotalsForUser(presence);
      Object.keys(userInvestments).forEach((investible_id) => {
        const oldValue = acc[investible_id] || { investible_id, numSupporters: 0, investments: []}
        const newValue = {
          ...oldValue,
          numSupporters: oldValue.numSupporters + 1,
          investments: [...oldValue.investments, userInvestments[investible_id]],
        };
        acc[investible_id] = newValue;
      });
      return acc;
    }, {});
  }

  function getCertaintyChart(investments) {
    return <MicroBarChart
      data={investments}
      height={10}
      width={20}
    />
  }

  function getItemVote(item) {
    const { investible_id, numSupporters, investments } = item;
    const inv = investibles.find((inv) => inv.investible.id === investible_id);
    if (!inv) {
      return null;
    }
    const { investible } = inv;
    const { name } = investible;
    return (
      <div key={investible_id}>
        <Badge
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

      </div>
    );
  }


  const tallies = computeVoteTallies();
  const noVotes = _.isEmpty(tallies) || _.isEmpty(investibles);
  if (noVotes) {
    return (
      <Typography>{noVotesMessage}</Typography>
    );
  }

  const talliesArray = Object.values(tallies);
  // descending order of support
  const sortedTalliesArray = _.sortBy(talliesArray, 'numSupporters').reverse();


  return (
    <React.Fragment>
      {sortedTalliesArray.map((item) => getItemVote(item))}
    </React.Fragment>
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