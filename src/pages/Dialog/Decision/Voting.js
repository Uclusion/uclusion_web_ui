import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Typography, Badge } from '@material-ui/core';
import EmojiPeopleIcon from '@material-ui/icons/EmojiPeople';

function Voting(props) {

  const { marketPresences, investibles } = props;
  const noVotesMessage = "No active votes";

  function computeVoteTallies() {
    marketPresences.reduce((acc, presence) => {
      const { id: user_id } = presence;
      const { investments } = presence;
      investments.forEach((investment) => {
        const { investible_id, quantity } = investment;
        const oldValue = acc[investible_id] || [];
        const newValue = [...oldValue, { user_id, quantity }];
        return {
          ...acc,
          [investible_id]: newValue,
        };
      });
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
      numSupporters: tallies[key].length
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