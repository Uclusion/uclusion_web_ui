import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Typography, Badge } from '@material-ui/core';
import EmojiPeopleIcon from '@material-ui/icons/EmojiPeople';

function Voting(props) {

  const { marketPresences, investibles } = props;
  const noVotesMessage = "No active votes";

  function computeVoteTallies() {
    return marketPresences.reduce((acc, presence) => {
      const newAcc = { ...acc };
      const { id: user_id, investments } = presence;
      for (let x = 0; x < investments.length; x += 1) {
        const { investible_id, quantity } = investments[x];
        const oldValue = acc[investible_id] || [];
        const newValue = [...oldValue, { user_id, quantity }];
        newAcc[investible_id] = newValue;
      }
      return newAcc;
    }, {});
  }

  const tallies = computeVoteTallies();
  const noVotes = _.isEmpty(tallies);
  if (noVotes) {
    return (
      <Typography>{noVotesMessage}</Typography>
    );
  }

  const talliesCount = Object.keys(tallies).map((key) => {
    return {
      investible_id: key,
      numSupporters: tallies[key].length,
      total: tallies[key].reduce((sum, item) => sum + item.quantity, 0),
    };
  });
  const sortedTalliesCount = _.sortBy(talliesCount, 'numSupporters');

  function getItemVote(item) {
    const { investible_id, numSupporters } = item;
    const inv = investibles.find((inv) => inv.id === investible_id);
    const { investible } = inv;
    const { name } = investible;
    return (
      <div key={investible_id}>
        <Typography
          noWrap>
          {name}
        </Typography>
        <Badge
          badgeContent={numSupporters}
        >
          <EmojiPeopleIcon/>
        </Badge>
      </div>
    );
  }

  return (
    <React.Fragment>
      {sortedTalliesCount.map(getItemVote)}
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